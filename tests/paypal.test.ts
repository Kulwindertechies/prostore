import { generateAccessTokens, paypal } from '../lib/paypal';

test('generate token from paypal', async () => {
    const tokenResponse = await generateAccessTokens();
    console.log(tokenResponse);
    expect(typeof tokenResponse).toBe('string');
    expect(tokenResponse.length).toBeGreaterThan(0);
});

// test create order
test('create order from paypal', async () => {
 const token = await generateAccessTokens();

 const price = 10.0;

 const orderResponse = await paypal.createOrder(price);
 console.log(orderResponse);
expect(orderResponse).toHaveProperty('id');
expect(orderResponse).toHaveProperty('status');
expect(orderResponse.status).toBe('CREATED');

});


// test capture payment with mock order
test('simulate capturing a payment from an order', async () => {
  const orderID = '100';

  const mockCapturePayment = jest
  .spyOn(paypal, 'capturePayment')
  .mockResolvedValue({
    status: 'COMPLETED',
  });

    const captureResponse = await paypal.capturePayment(orderID);

    expect(captureResponse).toHaveProperty('status', 'COMPLETED');

    mockCapturePayment.mockRestore();

})