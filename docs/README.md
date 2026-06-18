# Documentation — ArrowMaze Client

This folder holds the design documentation required by the project brief (Section 4).

## Diagrams

| File | Description | Editable source |
| --- | --- | --- |
| `diagrams/class-diagram.png` | Class diagram (entities, use cases, repositories, services, presenters) mapped to Clean Architecture layers and GoF patterns. | ⚠️ **Pending** — export the editable `.drawio`/`.puml` here as `diagrams/class-diagram.drawio`. |
| `diagrams/clean-architecture.png` | Concentric 4-layer Clean Architecture diagram with the dependency rule and ports/adapters. | ⚠️ **Pending** — add `diagrams/clean-architecture.drawio`. |

> **Action required before delivery:** the brief (Section 4) demands **both** the PNG image **and** the editable
> source file (`.drawio`, `.puml`, etc.) for each diagram. The PNGs are already here; commit the editable sources
> alongside them so they can be regenerated.

## Conventions

- Diagrams are embedded in the root [`README.md`](../README.md) under the *Architecture* and *Design Patterns* sections.
- Keep diagram colors consistent with the Clean Architecture layer legend (Domain = yellow, Use Cases = purple,
  Interface Adapters = blue/teal, Frameworks & Drivers = grey).
