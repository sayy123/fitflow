import prisma from '@/lib/prisma';
import { createMollieClient, MollieClient } from '@mollie/api-client';

export async function withMollieClient<T>(orgId: string, action: (client: MollieClient) => Promise<T>): Promise<T> {
  const org = await prisma.organizations.findUnique({ where: { id: orgId } });
  if (!org || !org.mollie_access_token) {
    throw new Error('Mollie not configured or missing access token');
  }

  let client = createMollieClient({ accessToken: org.mollie_access_token });
  
  try {
    return await action(client);
  } catch (error: unknown) {
    const err = error as any;
    if ((err.statusCode === 401 || err.message?.includes('Missing authentication')) && org.mollie_refresh_token) {
      // Refresh token
      const tokenResponse = await fetch('https://api.mollie.com/oauth2/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.MOLLIE_CLIENT_ID}:${process.env.MOLLIE_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: org.mollie_refresh_token
        }).toString()
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Save new tokens
        await prisma.organizations.update({
          where: { id: orgId },
          data: { 
            mollie_access_token: tokenData.access_token,
            mollie_refresh_token: tokenData.refresh_token || org.mollie_refresh_token
          }
        });
        
        // Retry with new client
        client = createMollieClient({ accessToken: tokenData.access_token });
        return await action(client);
      } else {
        console.error('[MOLLIE REFRESH ERROR]', tokenData);
        throw new Error('Failed to refresh Mollie token: ' + (tokenData.error_description || tokenData.error));
      }
    }
    throw error;
  }
}
