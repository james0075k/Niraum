import { authService } from '../services/auth.service.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../services/token.service.js';
import { AppError } from '../utils/AppError.js';
import { ah } from '../utils/asyncHandler.js';
import { changePasswordBody, forgotBody, loginBody, resetBody } from '../validators/auth.js';
import { actorOf, userIdOf } from './helpers.js';

export const authController = {
  login: ah(async (req, res) => {
    const { email, password, captchaToken } = loginBody.parse(req.body);
    const { user, session } = await authService.login(email, password, actorOf(req), captchaToken);
    setAuthCookies(res, session);
    res.json({ data: user.toJSON() });
  }),

  /** Rotation: every refresh issues a brand-new token pair. */
  refresh: ah(async (req, res) => {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || !token) throw AppError.unauthenticated();
    try {
      const { user, session } = await authService.refresh(token);
      setAuthCookies(res, session);
      res.json({ data: user.toJSON() });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }),

  logout: ah(async (req, res) => {
    await authService.logout(
      { access: req.cookies?.[ACCESS_COOKIE], refresh: req.cookies?.[REFRESH_COOKIE] },
      actorOf(req),
    );
    clearAuthCookies(res);
    res.status(204).end();
  }),

  forgot: ah(async (req, res) => {
    const { email } = forgotBody.parse(req.body);
    await authService.forgotPassword(email, actorOf(req));
    res.status(202).json({
      data: { message: 'If that email belongs to an account, a reset link is on its way.' },
    });
  }),

  reset: ah(async (req, res) => {
    const { token, password } = resetBody.parse(req.body);
    await authService.resetPassword(token, password, actorOf(req));
    clearAuthCookies(res);
    res.json({ data: { message: 'Password updated — sign in with your new password.' } });
  }),

  changePassword: ah(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordBody.parse(req.body);
    const { user, session } = await authService.changePassword(
      userIdOf(req),
      currentPassword,
      newPassword,
      actorOf(req),
    );
    setAuthCookies(res, session); // new version → fresh cookies for this session
    res.json({ data: user.toJSON() });
  }),

  me: ah(async (req, res) => {
    const user = await authService.me(userIdOf(req));
    res.json({ data: user.toJSON() });
  }),
};
