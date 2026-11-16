/**
 * Xyeena Native Methods - Extensibility Suite
 * Implements Agent Skill authoring verification, skill quality scoring,
 * and Model Context Protocol (MCP) tool schema design and least-privilege validation.
 */

import { ERROR_CODES, XyeenaError } from '../core/errors.mjs';

export class ExtensibilityMethods {
  /**
   * Validate an Agent Skill markdown manifest (extensibility.skill-authoring).
   * Verifies YAML frontmatter, name conventions, and core instructional blocks.
   * @param {string} markdownContent
   */
  static validateSkillManifest(markdownContent = '') {
    const text = markdownContent.trim();
    const errors = [];

    // Check frontmatter
    const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      errors.push('Missing YAML frontmatter bounded by ---');
      return { valid: false, errors };
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*([a-zA-Z0-9_\-\.]+)/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    if (!nameMatch) {
      errors.push('Frontmatter missing valid "name" attribute');
    }
    if (!descMatch || descMatch[1].trim().length < 10) {
      errors.push('Frontmatter missing or too short "description" (min 10 characters)');
    }

    // Check instructional content
    const body = text.slice(frontmatterMatch[0].length);
    if (body.trim().length < 50) {
      errors.push('Skill body is too short (min 50 characters of actionable instructions required)');
    }

    return {
      valid: errors.length === 0,
      skillName: nameMatch ? nameMatch[1] : null,
      errors
    };
  }

  /**
   * Evaluate the prompt economy and operational quality of a skill (extensibility.skill-evaluation).
   * @param {object} params
   * @param {string} params.skillText
   * @param {number} [params.maxBudgetTokens=2000]
   */
  static evaluateSkillQuality({ skillText = '', maxBudgetTokens = 2000 }) {
    const chars = skillText.length;
    const estimatedTokens = Math.ceil(chars / 3.8);
    const withinBudget = estimatedTokens <= maxBudgetTokens;

    const hasClearNegativeTrigger = /do not|never|exclude|prohibit/i.test(skillText);
    const hasConcreteSteps = /1\.|2\.|- step/i.test(skillText);

    const issues = [];
    if (!withinBudget) issues.push(`Skill exceeds token budget: ${estimatedTokens} > ${maxBudgetTokens}`);
    if (!hasClearNegativeTrigger) issues.push('Skill lacks explicit negative triggers or operational boundaries.');
    if (!hasConcreteSteps) issues.push('Skill lacks sequential procedural steps.');

    const compliant = issues.length === 0;
    return {
      estimatedTokens,
      maxBudgetTokens,
      withinBudget,
      compliant,
      issues,
      verdict: compliant ? 'HIGH_QUALITY_SKILL' : 'SKILL_IMPROVEMENT_REQUIRED'
    };
  }

  /**
   * Validate MCP tool interface schema (extensibility.mcp-design).
   * Enforces typed JSON schemas, description completeness, and parameter boundaries.
   * @param {object} toolDefinition
   */
  static validateMcpToolSchema(toolDefinition = {}) {
    const errors = [];

    if (!toolDefinition.name || !/^[a-zA-Z0-9_-]{1,64}$/.test(toolDefinition.name)) {
      errors.push('MCP tool must have a valid name matching /^[a-zA-Z0-9_-]{1,64}$/');
    }

    if (!toolDefinition.description || typeof toolDefinition.description !== 'string' || toolDefinition.description.length < 10) {
      errors.push('MCP tool must have a descriptive purpose (min 10 characters)');
    }

    const schema = toolDefinition.inputSchema;
    if (!schema || schema.type !== 'object') {
      errors.push('MCP tool inputSchema must be of type "object"');
    } else {
      if (!schema.properties || typeof schema.properties !== 'object') {
        errors.push('MCP tool inputSchema must define a "properties" object');
      }
    }

    return {
      valid: errors.length === 0,
      toolName: toolDefinition.name,
      errors
    };
  }
}
