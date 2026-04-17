import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getFallback } from "../controllers/analyzeController.js";

// These are the exact bugs we've hit in production — regression tests

describe("getFallback — keyword matching", () => {
  // ── The original bug: "detained" contains "ai" as substring ──────────────
  it('does NOT match tech category for "detained" (contains "ai" substring)', () => {
    const result = getFallback("ICE Has Detained Marie-Thérèse Ross-Mahé, an 85-Year-Old Widow");
    assert.notEqual(result.category, "Technology & Society");
  });

  it('matches immigration category for ICE/detained headlines', () => {
    const result = getFallback("ICE Has Detained Marie-Thérèse Ross-Mahé, an 85-Year-Old Widow");
    assert.equal(result.category, "Immigration");
  });

  it('does NOT match tech for "daily" or "rained" (other "ai" substrings)', () => {
    const result = getFallback("It rained heavily in the daily briefing");
    assert.notEqual(result.category, "Technology & Society");
  });

  // ── AI as a whole word should still match tech ────────────────────────────
  it('matches tech category when "AI" appears as a whole word', () => {
    const result = getFallback("AI startup raises $500M in record funding round");
    assert.equal(result.category, "Technology & Society");
  });

  it('matches tech for "artificial intelligence"', () => {
    const result = getFallback("Artificial intelligence is changing how doctors diagnose patients");
    assert.equal(result.category, "Technology & Society");
  });

  // ── Other categories ──────────────────────────────────────────────────────
  it('matches immigration for "border" headlines', () => {
    const result = getFallback("Migrants crossing the southern border surge");
    assert.equal(result.category, "Immigration");
  });

  it('matches immigration for "deport" headlines', () => {
    const result = getFallback("Government moves to deport thousands of asylum seekers");
    assert.equal(result.category, "Immigration");
  });

  it('matches economic crisis for stock market headlines', () => {
    const result = getFallback("Stock market plunges amid inflation fears");
    assert.equal(result.category, "Economic Crisis");
  });

  it('matches political crisis for election headlines', () => {
    const result = getFallback("Election results challenged by losing candidate");
    assert.equal(result.category, "Political Crisis");
  });

  it('matches environmental disaster for climate headlines', () => {
    const result = getFallback("Wildfire destroys thousands of acres in California");
    assert.equal(result.category, "Environmental Disaster");
  });

  it('matches public health for pandemic headlines', () => {
    const result = getFallback("New virus outbreak detected in three countries");
    assert.equal(result.category, "Public Health");
  });

  it('matches military conflict for war headlines', () => {
    const result = getFallback("Military troops advance on disputed territory");
    assert.equal(result.category, "Military Conflict");
  });

  it('returns default fallback for completely unmatched headlines', () => {
    const result = getFallback("Local baker wins county pie competition");
    assert.equal(result.event, "The Printing Press Revolution");
  });

  // ── Shape validation ──────────────────────────────────────────────────────
  it('always returns event, year, category, explanation', () => {
    const result = getFallback("Anything at all");
    assert.ok(result.event, "missing event");
    assert.ok(result.year, "missing year");
    assert.ok(result.category, "missing category");
    assert.ok(result.explanation, "missing explanation");
  });
});
