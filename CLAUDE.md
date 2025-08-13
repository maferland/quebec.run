# Claude Development Guidelines

## Testing Guidelines

### Avoid using `.getByTestId()`
- Use semantic queries instead: `getByRole()`, `getByText()`, `getByLabelText()`
- These queries reflect how users interact with the UI
- TestIds should only be used as a last resort when no semantic query works