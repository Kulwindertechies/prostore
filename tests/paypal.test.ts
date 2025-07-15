import { generateAccessTokens } from '../lib/paypal';

test('generate token from paypal', async () => {
    const tokenResponse = await generateAccessTokens();
    console.log(tokenResponse);
    expect(typeof tokenResponse).toBe('string');
    expect(tokenResponse.length).toBeGreaterThan(0);
});
