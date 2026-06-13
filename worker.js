const BACKEND = "https://peerly-backend.infinityfree.me";
const ALLOWED_ORIGINS = [
  "https://doubleddoge.github.io",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

let cachedTestCookie = null;
let cookieCacheTime = 0;
const COOKIE_CACHE_TTL = 3600000;

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function solveChallenge(html) {
  try {
    // Log the challenge HTML to see the exact format
    const challengeStart = html.indexOf("toNumbers");
    const challengeSection = html.substring(Math.max(0, challengeStart), Math.min(html.length, challengeStart + 500));
    console.log(`[Challenge] HTML section: ${challengeSection}`);

    const matches = [...html.matchAll(/toNumbers\("([0-9a-f]+)"\)/g)];
    console.log(`[Challenge] Found ${matches.length} hex values in HTML`);
    
    if (matches.length < 3) {
      console.log("[Challenge] Not enough hex values found, returning null");
      return null;
    }

    const dataHex = matches[0][1];
    const keyHex = matches[1][1];
    const ivHex = matches[2][1];

    console.log(`[Challenge] Full data hex: ${dataHex}`);
    console.log(`[Challenge] Full key hex: ${keyHex}`);
    console.log(`[Challenge] Full IV hex: ${ivHex}`);

    const dataBytes = hexToBytes(dataHex);
    const keyBytes = hexToBytes(keyHex);
    const ivBytes = hexToBytes(ivHex);

    console.log(`[Challenge] Data bytes: ${dataBytes.length}, Key bytes: ${keyBytes.length}, IV bytes: ${ivBytes.length}`);

    if (dataBytes.length < 16) {
      console.log(`[Challenge] Data too short: ${dataBytes.length} bytes (minimum 16)`);
      return null;
    }

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(keyBytes),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    console.log("[Challenge] Attempting decryption...");

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: new Uint8Array(ivBytes) },
      cryptoKey,
      new Uint8Array(dataBytes)
    );

    const decryptedBytes = new Uint8Array(decrypted);
    console.log(`[Challenge] Decrypted ${decryptedBytes.length} bytes: ${bytesToHex(Array.from(decryptedBytes))}`);

    const padLength = decryptedBytes[decryptedBytes.length - 1];
    console.log(`[Challenge] Pad length indicator: ${padLength}`);

    if (padLength > decryptedBytes.length || padLength > 16) {
      console.log(`[Challenge] Invalid padding: ${padLength}, returning all bytes`);
      return bytesToHex(Array.from(decryptedBytes));
    }

    const unpadded = decryptedBytes.slice(0, decryptedBytes.length - padLength);
    const result = bytesToHex(Array.from(unpadded));

    console.log(`[Challenge] Successfully solved, cookie: ${result}`);
    return result;
  } catch (err) {
    console.error("[Challenge] Error solving challenge:", err.message);
    console.error("[Challenge] Stack:", err.stack);
    return null;
  }
}

async function fetchBackend(url, options = {}, attemptNumber = 1) {
  console.log(`[Fetch] Attempt ${attemptNumber}: ${url}`);
  
  const makeRequest = (cookie) => {
    const headers = {
      ...BROWSER_HEADERS,
      ...options.headers,
    };
    if (cookie) {
      headers["Cookie"] = `__test=${cookie}`;
      console.log(`[Fetch] Including cookie in request`);
    }
    return fetch(url, {
      ...options,
      headers,
      body: options.body,
    });
  };

  // Check cached cookie (only on first attempt)
  if (attemptNumber === 1 && cachedTestCookie && Date.now() - cookieCacheTime < COOKIE_CACHE_TTL) {
    console.log("[Fetch] Using cached cookie");
    const response = await makeRequest(cachedTestCookie);
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      console.log("[Fetch] Cached cookie worked!");
      return response;
    }
    console.log("[Fetch] Cached cookie expired or invalid");
    cachedTestCookie = null;
  }

  // Initial request without cookie
  console.log("[Fetch] Making request without cookie");
  const firstResponse = await makeRequest(null);
  const contentType = firstResponse.headers.get("content-type") ?? "";
  
  if (contentType.includes("application/json")) {
    console.log("[Fetch] Got JSON response without challenge");
    return firstResponse;
  }

  // Check if challenge is needed
  const html = await firstResponse.text();
  console.log(`[Fetch] Response length: ${html.length}, contains aes.js: ${html.includes("aes.js")}`);
  
  if (!html.includes("aes.js")) {
    console.log("[Fetch] No challenge detected");
    return new Response(html, {
      status: firstResponse.status,
      headers: firstResponse.headers,
    });
  }

  // Solve challenge
  console.log("[Fetch] Challenge detected, solving...");
  const cookieValue = await solveChallenge(html);
  
  if (!cookieValue) {
    console.log("[Fetch] Failed to solve challenge");
    return new Response(html, {
      status: firstResponse.status,
      headers: firstResponse.headers,
    });
  }

  cachedTestCookie = cookieValue;
  cookieCacheTime = Date.now();
  console.log("[Fetch] Challenge solved, retrying with cookie");

  // Retry with cookie
  if (attemptNumber < 2) {
    return fetchBackend(url, options, attemptNumber + 1);
  }

  return makeRequest(cookieValue);
}

function getCorsHeaders(origin) {
  const headers = { ...CORS_HEADERS };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }
  return headers;
}

export default {
  async fetch(request) {
    const origin = request.headers.get("origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const backendUrl = BACKEND + url.pathname + url.search;

      console.log(`[Request] ${request.method} ${url.pathname}${url.search}`);

      // Forward headers
      const forwardedHeaders = {};
      const blockedHeaders = ["host", "cf-connecting-ip", "cf-ray", "cf-visitor", "x-forwarded-for", "cookie", "origin"];
      for (const [key, value] of request.headers.entries()) {
        if (!blockedHeaders.includes(key.toLowerCase())) {
          forwardedHeaders[key] = value;
        }
      }

      // Get request body
      const bodyBuffer = ["GET", "HEAD"].includes(request.method)
        ? null
        : await request.arrayBuffer();

      // Fetch from backend
      const backendResponse = await fetchBackend(backendUrl, {
        method: request.method,
        headers: forwardedHeaders,
        body: bodyBuffer,
      });

      const responseText = await backendResponse.text();
      let responseData = responseText.trim();
      let isJson = false;

      // Try to parse as JSON
      try {
        JSON.parse(responseData);
        isJson = true;
        console.log("[Response] Valid JSON");
      } catch (e) {
        console.log("[Response] Invalid JSON, attempting extraction");
        // Attempt to extract JSON
        const firstBrace = responseData.indexOf('{');
        const lastBrace = responseData.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          try {
            const extracted = responseData.substring(firstBrace, lastBrace + 1);
            JSON.parse(extracted);
            responseData = extracted;
            isJson = true;
            console.log("[Response] Successfully extracted JSON");
          } catch (err) {
            console.log("[Response] Failed to extract valid JSON");
          }
        }
      }

      if (!isJson) {
        console.log("[Response] Returning 502 error");
        return new Response(
          JSON.stringify({
            error: "Backend returned non-JSON response",
            status: backendResponse.status,
            preview: responseText.substring(0, 200),
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      return new Response(responseData, {
        status: backendResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error("[Worker] Error:", error);
      return new Response(
        JSON.stringify({
          error: "Worker error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...getCorsHeaders(request.headers.get("origin") || ""),
          },
        }
      );
    }
  },
};
