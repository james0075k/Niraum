import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { vi } from 'vitest';
import { api } from '@/lib/api';

/** Fake transport: answers 401 for the URLs listed, 200 otherwise. */
function adapterWith(unauthorized: string[]) {
  return vi.fn(async (config: InternalAxiosRequestConfig) => {
    const response = {
      data: unauthorized.includes(config.url ?? '')
        ? { error: { code: 'UNAUTHENTICATED', message: 'no' } }
        : { data: { ok: true } },
      status: unauthorized.includes(config.url ?? '') ? 401 : 200,
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    };
    if (response.status === 401) {
      throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response);
    }
    return response;
  });
}

describe('api refresh interceptor', () => {
  const original = api.defaults.adapter;
  let expired: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    expired = vi.fn();
    window.addEventListener('niraum:auth-expired', expired);
  });
  afterEach(() => {
    window.removeEventListener('niraum:auth-expired', expired);
    api.defaults.adapter = original;
  });

  it('emits niraum:auth-expired when the refresh fails', async () => {
    api.defaults.adapter = adapterWith(['/admin/products', '/auth/refresh']);
    await expect(api.get('/admin/products')).rejects.toBeInstanceOf(AxiosError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('does not emit for auth calls (their 401s are answers, not expiry)', async () => {
    api.defaults.adapter = adapterWith(['/auth/me']);
    await expect(api.get('/auth/me')).rejects.toBeInstanceOf(AxiosError);
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not emit when the refresh succeeds', async () => {
    const adapter = adapterWith(['/admin/products']);
    api.defaults.adapter = adapter;
    // second call to /admin/products succeeds after refresh
    adapter.mockImplementationOnce(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, {
        data: {},
        status: 401,
        statusText: '',
        headers: new AxiosHeaders(),
        config,
      });
    });
    adapter.mockImplementation(async (config: InternalAxiosRequestConfig) => ({
      data: { data: { ok: true } },
      status: 200,
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    }));
    await expect(api.get('/admin/products')).resolves.toMatchObject({ status: 200 });
    expect(expired).not.toHaveBeenCalled();
  });
});
