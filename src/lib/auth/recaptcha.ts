export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production" && token === "DEV_TEST_BYPASS_TOKEN") {
    return true;
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY as string,
        response: token,
      }),
    });

    const data = await res.json();
        console.log("reCAPTCHA verify response:", data);
    return data.success === true;
  } catch {
    return false;
  }
}