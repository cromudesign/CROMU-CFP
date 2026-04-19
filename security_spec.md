# Security Spec: FinanFlow

## Data Invariants
- Uma transação deve pertencer a um usuário autenticado (`userId`).
- Usuários só podem ler e escrever suas próprias transações.
- Campos como `createdAt` são imutáveis após a criação.
- `updatedAt` deve ser validado com o timestamp do servidor.
- Document IDs devem ser strings seguras.

## The "Dirty Dozen" Payloads (Deny cases)
1. Criar transação sem estar autenticado.
2. Criar transação com `userId` de outro usuário.
3. Ler transações de outro usuário.
4. Atualizar `userId` de uma transação existente.
5. Injetar campo fantasma `isAdmin: true` no perfil (se existisse).
6. Enviar `valor` como string em vez de número.
7. Enviar `status` inválido (ex: 'unknown').
8. Atualizar `createdAt` após a criação.
9. Criar transação com data futura impossível (data range check).
10. Tentar listar todas as transações de todos os usuários (blanket read).
11. Usar um ID de documento gigante (>128 chars).
12. Enviar payload sem os campos obrigatórios.

## Red Team Strategy
- Validar se `affectedKeys().hasOnly()` previne Shadow Updates.
- Garantir que `resource.data.userId` é verificado em todas as operações de lista.
