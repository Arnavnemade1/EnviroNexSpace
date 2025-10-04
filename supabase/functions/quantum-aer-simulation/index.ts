import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuantumSimulationRequest {
  features: number[];
  qubits: number;
  shots: number;
  base_aqi: number;
}

interface QuantumSimulationResponse {
  predicted_aqi: number;
  confidence: number;
  measurement_counts: Record<string, number>;
  quantum_entropy: number;
  shots: number;
  backend: string;
  circuit_depth: number;
  circuit_qubits: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: QuantumSimulationRequest = await req.json();

    const { features, qubits, shots, base_aqi } = body;

    const pythonInput = JSON.stringify({
      features,
      qubits: qubits || 5,
      shots: shots || 1024,
      base_aqi: base_aqi || 50,
    });

    const pythonScriptPath = new URL("./qiskit_runner.py", import.meta.url).pathname;

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

    if (stderrText && !stderrText.includes("UserWarning")) {
      console.error("Python stderr:", stderrText);
    }

    let result: QuantumSimulationResponse;

    try {
      result = JSON.parse(stdoutText);
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdoutText);
      throw new Error(`JSON parse error: ${parseError}`);
    }

    if (result.error) {
      throw new Error(`Quantum simulation error: ${result.error}`);
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Quantum Aer simulation error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        backend: "error-fallback",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
