import React, { useState } from "react";
import "./style.css";

const API_URL = process.env.REACT_APP_API_URL || "https://localhost:7001/api/probabilities";

export default function ProbCalculator() {
  const [pA, setPA] = useState("");
  const [pB, setPB] = useState("");
  const [operation, setOperation] = useState("CombinedWith");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

    // Client-Side Validation Logic
    const isValidProbability = (value) => {
        const num = parseFloat(value);
        // Check if it's a number, and if it's between 0 and 1 inclusive.
        return !isNaN(num) && num >= 0 && num <= 1;
    };

    const validateInputs = () => {
        if (pA === '' || pB === '') {
            return 'Please enter values for both probabilities.';
        }
        if (!isValidProbability(pA)) {
            return 'Probability A must be between 0 and 1.';
        }
        if (!isValidProbability(pB)) {
            return 'Probability B must be between 0 and 1.';
        }
        return null; // No error
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        setResult(null);
        setError(null);

        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
          const targetUrl = `${API_URL}/${operation.toLowerCase()}`;
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // API request body
                body: JSON.stringify({
                    probabilityA: parseFloat(pA),
                    probabilityB: parseFloat(pB)
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle API-side validation errors (e.g., from C# service) or 500 errors
                setError(data.error || `Calculation failed with status: ${response.status}`);
            } else {
                setResult(data.result);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not connect to the backend API. Check if the C# service is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setPA('');
        setPB('');
        setOperation('CombinedWith');
        setResult(null);
        setError(null);
    }

    // Helper to format the result display
    const formatResult = () => {
        if (result === null) return '0.0000';
        // Use toLocaleString for reliable formatting with a fixed number of decimals
        return parseFloat(result).toFixed(4).toLocaleString('en-US', { minimumFractionDigits: 4 });
    };

    // Helper to generate the formula string
    const getFormula = () => {
        const pAVal = parseFloat(pA);
        const pBVal = parseFloat(pB);

        if (operation === 'CombinedWith') {
            return `P(A) * P(B) = ${pAVal.toFixed(2)} * ${pBVal.toFixed(2)}`;
        } else {
            return `P(A) + P(B) - P(A)P(B) = ${pAVal.toFixed(2)} + ${pBVal.toFixed(2)} - (${pAVal.toFixed(2)} * ${pBVal.toFixed(2)})`;
        }
    }

  return (
    <div className="calc-page">
      <div className="calc-card">
        <header className="calc-header">
          <h1 className="calc-title">Probability Calculator</h1>
          <p className="calc-sub">Calculate combined or either probability events. Inputs must be between 0 and 1.</p>
        </header>

        <form onSubmit={handleCalculate} className="calc-form">
          <div className="inputs-row">
            <div className="input-field">
              <label>Probability A (P(A))</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="e.g. 0.5"
                value={pA}
                onChange={(e) => setPA(e.target.value)}
                className={pA !== "" && !isValidProbability(pA) ? "invalid" : ""}
              />
            </div>

            <div className="input-field">
              <label>Probability B (P(B))</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="e.g. 0.5"
                value={pB}
                onChange={(e) => setPB(e.target.value)}
                className={pB !== "" && !isValidProbability(pB) ? "invalid" : ""}
              />
            </div>
          </div>

          <div className="operation-section">
            <label className="section-label">Select Function</label>
            <div className="operation-buttons">
              <button
                type="button"
                onClick={() => setOperation("CombinedWith")}
                className={`btn-op ${operation === "CombinedWith" ? "selected" : ""}`}
                aria-pressed={operation === "CombinedWith"}
              >
                <div className="op-title">CombinedWith</div>
                <div className="op-sub">P(A) * P(B)</div>
              </button>

              <button
                type="button"
                onClick={() => setOperation("Either")}
                className={`btn-op ${operation === "Either" ? "selected" : ""}`}
                aria-pressed={operation === "Either"}
              >
                <div className="op-title">Either</div>
                <div className="op-sub">P(A) + P(B) - P(A)P(B)</div>
              </button>
            </div>
          </div>

          <div className="actions-row">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Calculating..." : "Calculate Result"}
            </button>
            <button type="button" className="btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <div className="status-area">
          {error && (
            <div className="status error">
              <strong>Error:</strong> <span>{error}</span>
            </div>
          )}

          {result !== null && (
            <div className="status success">
              <div className="success-left">
                <div className="success-title">Calculation Successful</div>
                              <div className="success-sub">{getFormula()}</div>
              </div>
              <div className="success-value">{formatResult(result)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );  
}