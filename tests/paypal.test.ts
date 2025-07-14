import { generateAccessToken } from "@/lib/paypal";

// test the generateAccessToken function
test('generate token from paypal', async () => {
    const tokenResponse = await generateAccessToken();
    console.log(tokenResponse);
    expect(tokenResponse).toBe('string');
    expect(tokenResponse.length).toBeGreaterThan(0);
})