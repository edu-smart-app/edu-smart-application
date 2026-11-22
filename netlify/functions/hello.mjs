export default async (req) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "EDU SMART backend is working!"
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
