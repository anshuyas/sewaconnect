export async function verifyRecaptcha(token: string): Promise<boolean> {
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
    console.log("reCAPTCHA verification response:", data); // TEMPORARY debug line

    return data.success === true && data.score >= 0.5;
  } catch (err) {
    console.log("reCAPTCHA verification error:", err); // TEMPORARY debug line
    return false;
  }
}