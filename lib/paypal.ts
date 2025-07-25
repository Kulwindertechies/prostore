const base = "https://api-m.sandbox.paypal.com";

export const paypal = {
    createOrder: async function createOrder(price: number){
        const accessToken = await generateAccessTokens();
        const url = `${base}/v2/checkout/orders`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: price,
                    }
                }]
            })
        });

    return handleResponse(response);
    },
    capturePayment: async function capturePayment(orderId: string) {
        const accessToken = await generateAccessTokens();
        const url = `${base}/v2/checkout/orders/${orderId}/capture`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return handleResponse(response);
    },
};

// generate a token for PayPal API
 export async function generateAccessTokens() {
    const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');

    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    });

        const jsondata = await handleResponse(response);
        return jsondata.access_token;
}

 async function handleResponse(response: Response) {
    if(response.ok) {
        return response.json();
    } else {
        const errorText = await response.text();
        throw new Error(errorText);
    }

 }
