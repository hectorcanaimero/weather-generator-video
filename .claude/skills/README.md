# Custom Skills for Creem Year Recap

This directory contains custom Claude Code skills for this project.

## Available Skills

### `/gtm-video` - Go-to-Market Video Composer

Creates new Remotion video compositions based on marketing and go-to-market ideas.

**Key Features**:
- ✅ Strategic analysis before implementation
- ✅ Mandatory approval workflow
- ✅ Go-to-market expertise built-in
- ✅ Follows project architecture patterns
- ✅ Creem.io brand consistency

**Example Usage**:

```bash
# In Claude Code, type:
/gtm-video crear un video celebrando 10,000 clientes con animaciones
```

The agent will:
1. Analyze the marketing objective
2. Present a detailed strategy with scene breakdown
3. Ask for your approval
4. Only then implement the video composition

---

### `/gtm-developer` - GTM Implementation Specialist

A senior developer agent that implements video compositions with production-grade code quality, clean architecture, and comprehensive documentation.

**Key Features**:
- ✅ Production-grade TypeScript + React code
- ✅ Comprehensive JSDoc documentation
- ✅ Clean code principles (DRY, SOLID, KISS)
- ✅ Performance-optimized animations
- ✅ Type-safe implementations
- ✅ Best practices enforcement

**Example Usage**:

```bash
# In Claude Code, type:
/gtm-developer implement the approved product showcase strategy
/gtm-developer build a user milestone celebration component
```

The agent will:
1. Review the strategy/requirements
2. Present an implementation plan
3. Request confirmation
4. Build high-quality, well-documented components

**When to Use**:
- Use `/gtm-video` for **strategy and planning**
- Use `/gtm-developer` for **implementation and coding**
- They work together: strategy first, then development

## How It Works

Skills are markdown files that contain specialized agent instructions. When you invoke a skill (e.g., `/gtm-video`), Claude Code loads the instructions and becomes a specialized agent for that task.

## Creating New Skills

To create a new skill:

1. Create a new `.md` file in this directory
2. Add a descriptive header and usage instructions
3. Include "Agent Instructions" section with specialized knowledge
4. Use the skill with `/<skill-name>`

See [gtm-video.md](gtm-video.md) for a comprehensive example.
