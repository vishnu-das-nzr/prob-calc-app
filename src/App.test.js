import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App"; // Assuming App resolves to the ProbCalculator component

// Define the API URL as it is in the Calculator component for correct assertion
const API_URL = process.env.REACT_APP_API_URL || "https://localhost:7001/api/probabilities";

beforeEach(() => {
    // Clear any global fetch mocks
    if (global.fetch && global.fetch.mockClear) global.fetch.mockClear();
});

afterEach(() => {
    if (global.fetch && global.fetch.mockRestore) {
        try { global.fetch.mockRestore(); } catch { }
    }
});

test("renders form controls", () => {
    render(<App />);

    // heading and subtext
    expect(screen.getByText(/Probability Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculate combined or either probability events/i)).toBeInTheDocument();

    // There are two inputs that share the same placeholder; assert both exist
    const placeholders = screen.getAllByPlaceholderText(/e.g. 0.5/i);
    expect(placeholders.length).toBeGreaterThanOrEqual(2);

    // buttons
    expect(screen.getByRole("button", { name: /Calculate Result/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset/i })).toBeInTheDocument();

    // operation buttons
    expect(screen.getByRole("button", { name: /CombinedWith/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Either/i })).toBeInTheDocument();
});

test("shows validation error when inputs are empty", async () => {
    render(<App />);

    const calcBtn = screen.getByRole("button", { name: /Calculate Result/i });
    await userEvent.click(calcBtn);

    // Error message should appear
    expect(await screen.findByText(/Please enter values for both probabilities/i)).toBeInTheDocument();
});

test("shows validation error when inputs are invalid", async () => {
    render(<App />);

    const allPlaceholders = screen.getAllByPlaceholderText(/e.g. 0.5/i);
    const pA = allPlaceholders[0];

    const calcBtn = screen.getByRole("button", { name: /Calculate Result/i });

    await userEvent.type(pA, "{selectall}1.5"); 
    await userEvent.type(allPlaceholders[1], "0.5");
    await userEvent.click(calcBtn);

    // Should show the correct validation error
    expect(await screen.findByText(/Probability A must be between 0 and 1/i)).toBeInTheDocument();
});

test("operation buttons toggle selected state (aria-pressed)", async () => {
    render(<App />);

    const combinedBtn = screen.getByRole("button", { name: /CombinedWith/i });
    const eitherBtn = screen.getByRole("button", { name: /^Either/i });

    // CombinedWith is selected by default
    expect(combinedBtn).toHaveAttribute("aria-pressed", "true");
    expect(eitherBtn).toHaveAttribute("aria-pressed", "false");

    // Click Either -> it should become selected
    await userEvent.click(eitherBtn);
    expect(eitherBtn).toHaveAttribute("aria-pressed", "true");
    expect(combinedBtn).toHaveAttribute("aria-pressed", "false");
});

test("successful calculation displays result (mocked fetch)", async () => {
    // Mock response should return the object { result: ... } to match C# Controller contract.
    const fakeResultObject = { result: 0.25 }; 
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => fakeResultObject,
    });

    render(<App />);

    const inputs = screen.getAllByPlaceholderText(/e.g. 0.5/i);
    const pA = inputs[0];
    const pB = inputs[1];
    const calcBtn = screen.getByRole("button", { name: /Calculate Result/i });

    await userEvent.type(pA, "0.5");
    await userEvent.type(pB, "0.5");
    await userEvent.click(calcBtn);

    // Check for the specific formatted result value.
    await waitFor(() => expect(screen.getByText("0.2500")).toBeInTheDocument());
    
    // ensure fetch was called exactly once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    
    // Check URL: We expect the URL to be the base URL + operation, as confirmed by the previous error.
    const expectedUrlWithOperation = `${API_URL}/combinedwith`;
    expect(url).toBe(expectedUrlWithOperation); 

    const body = JSON.parse(options.body);
    
    // FIX: Change assertion to use strict toEqual instead of objectContaining to fix cryptic diff issue.
    // This provides a cleaner assertion for the full payload.
    expect(body).toEqual({
        probabilityA: 0.5,
        probabilityB: 0.5,
    });

    global.fetch.mockRestore();
});

test("reset clears inputs and result", async () => {
    // Mock response should return the object { result: ... }
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ result: 0.12 }), 
    });

    render(<App />);

    const inputs = screen.getAllByPlaceholderText(/e.g. 0.5/i);
    const pA = inputs[0];
    const pB = inputs[1];

    const calcBtn = screen.getByRole("button", { name: /Calculate Result/i });
    const resetBtn = screen.getByRole("button", { name: /Reset/i });

    await userEvent.type(pA, "0.2");
    await userEvent.type(pB, "0.3");
    await userEvent.click(calcBtn);

    // Wait for result (0.1200) to appear
    await waitFor(() => expect(screen.getByText("0.1200")).toBeInTheDocument()); 

    // Click reset
    await userEvent.click(resetBtn);

    // Inputs should be cleared (empty string)
    expect(pA.value).toBe("");
    expect(pB.value).toBe("");

    // Result area (the formatted result) should no longer be present
    expect(screen.queryByText("0.1200")).not.toBeInTheDocument(); 

    global.fetch.mockRestore();
});