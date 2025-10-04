import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuantumJobRequest {
  features: number[];
  qubits: number;
  shots: number;
  base_aqi: number;
  timeout_ms?: number;
}

interface QuantumJobResponse {
  job_id?: string;
  status: "queued" | "running" | "completed" | "failed" | "timeout";
  predicted_aqi?: number;
  confidence?: number;
  measurement_counts?: Record<string, number>;
  quantum_entropy?: number;
  backend: string;
  backend_type?: string;
  is_real_quantum_hardware?: boolean;
  circuit_depth?: number;
  execution_time_ms?: number;
  error?: string;
}

async function getIBMAccessToken(): Promise<string> {
  const apiKey = Deno.env.get("IBM_QUANTUM_API_KEY");
  if (!apiKey) {
    throw new Error("IBM_QUANTUM_API_KEY not configured");
  }

  const response = await fetch("https://auth.quantum-computing.ibm.com/api/users/loginWithToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiToken: apiKey }),
  });

  if (!response.ok) {
    throw new Error(`IBM authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

async function submitQuantumJob(
  accessToken: string,
  features: number[],
  qubits: number,
  shots: number,
  base_aqi: number
): Promise<{ job_id: string }> {
  const pythonScriptPath = new URL("./qiskit_ibm_runtime.py", import.meta.url).pathname;

  const pythonInput = JSON.stringify({
    features,
    qubits,
    shots,
    base_aqi,
    api_token: accessToken,
  });

  const command = new Deno.Command("python3", {
    args: [pythonScriptPath],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();

  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(pythonInput));
  await writer.close();

  const { stdout, stderr } = await process.output();

  const stdoutText = new TextDecoder().decode(stdout);
  const stderrText = new TextDecoder().decode(stderr);

  if (stderrText && !stderrText.includes("UserWarning") && !stderrText.includes("DeprecationWarning")) {
    console.error("Python stderr:", stderrText);
  }

  const result = JSON.parse(stdoutText);

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: QuantumJobRequest = await req.json();
    // Increased timeout for real quantum hardware (can take 15-30s for real QPU execution)
    const { features, qubits, shots, base_aqi, timeout_ms = 30000 } = body;

    const startTime = Date.now();

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.warn("Failed to extract user ID from token:", e);
      }
    }

    const jobRecord = {
      user_id: userId,
      status: "queued",
      backend: "ibm-quantum-runtime",
      features: features,
      qubits,
      shots,
      created_at: new Date().toISOString(),
    };

    const accessToken = await getIBMAccessToken();

    const jobPromise = submitQuantumJob(accessToken, features, qubits, shots, base_aqi);

    const timeoutPromise = new Promise<QuantumJobResponse>((resolve) => {
      setTimeout(() => {
        console.log("IBM Quantum hardware timeout - falling back to Aer simulation");
        resolve({
          status: "timeout",
          backend: "timeout-fallback-to-aer",
          backend_type: "Timeout Fallback",
          is_real_quantum_hardware: false,
          execution_time_ms: Date.now() - startTime,
          error: "Real quantum hardware exceeded 30s timeout, will use Aer simulation fallback",
        });
      }, timeout_ms);
    });

    const result = await Promise.race([jobPromise, timeoutPromise]);

    if ("error" in result && result.error) {
      return new Response(
        JSON.stringify({
          status: "timeout",
          backend: "timeout-fallback",
          error: result.error,
        } as QuantumJobResponse),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response: QuantumJobResponse = {
      status: "completed",
      job_id: result.job_id,
      predicted_aqi: result.predicted_aqi,
      confidence: result.confidence,
      measurement_counts: result.measurement_counts,
      quantum_entropy: result.quantum_entropy,
      backend: result.backend || "ibm-quantum-runtime",
      backend_type: result.backend_type || "IBM Quantum Processor",
      is_real_quantum_hardware: result.is_real_quantum_hardware || true,
      circuit_depth: result.circuit_depth,
      execution_time_ms: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("IBM Quantum Runtime error:", error);

    return new Response(
      JSON.stringify({
        status: "failed",
        backend: "error-fallback",
        error: error instanceof Error ? error.message : String(error),
      } as QuantumJobResponse),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
