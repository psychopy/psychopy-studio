export async function GET({ request }) {
  const data = await fetch(
        `https://pavlovia.org/api/v2/experiments?search=demos&designer=demos?oauthToken=${request.headers.get("access")}`
    )
    .then(
        resp => resp.json()
    );


  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}