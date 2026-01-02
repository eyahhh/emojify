# 🚀 Guia Rápido - Como Fazer Commit

## Comandos Básicos (Use sempre nessa ordem)

### 1. Ver o que mudou
```bash
git status
```

### 2. Adicionar as mudanças
```bash
git add .
```
> Adiciona TODOS os arquivos modificados

**OU** adicionar arquivo específico:
```bash
git add nome-do-arquivo.js
```

### 3. Fazer o commit
```bash
git commit -m "Descrição do que você mudou"
```

**Exemplos de mensagens:**
- `git commit -m "Adiciona comando de ban"`
- `git commit -m "Corrige bug no sistema de XP"`
- `git commit -m "Atualiza README com instruções"`

### 4. Enviar pro GitHub
```bash
git push
```

---

## ⚡ Atalho Rápido (Tudo de uma vez)

```bash
git add . && git commit -m "sua mensagem aqui" && git push
```

---

## 🔍 Comandos Úteis

### Ver histórico de commits
```bash
git log --oneline
```

### Ver em qual branch você está
```bash
git branch
```

### Desfazer mudanças antes do commit
```bash
git checkout -- nome-do-arquivo.js
```

### Voltar ao último commit (CUIDADO!)
```bash
git reset --hard HEAD
```

---

## ⚠️ IMPORTANTE

### Sempre ignore esses arquivos:
- ✅ `.env` - **NUNCA** commite tokens/senhas!
- ✅ `node_modules/` - Muito pesado, se reinstala com `npm install`

### Seu `.gitignore` deve ter:
```
.env
node_modules/
```

---

## 🆘 Problemas Comuns

### "Nothing to commit"
Significa que não tem mudanças. Tudo já está salvo!

### "Failed to push"
Tente puxar as mudanças primeiro:
```bash
git pull
git push
```

### Mudou muita coisa e quer recomeçar?
```bash
git reset --hard HEAD
```
**CUIDADO:** Isso apaga TODAS as mudanças não commitadas!

---

## 📋 Fluxo de Trabalho Diário

1. Abra o projeto
2. Faça suas modificações no código
3. Teste se funciona
4. **Commit:**
   ```bash
   git add .
   git commit -m "O que você fez"
   git push
   ```
5. Repita!

---

## 🎯 Dica Final

**Faça commits pequenos e frequentes!**
- ✅ BOM: "Adiciona comando de kick"
- ✅ BOM: "Corrige erro de permissão"
- ❌ RUIM: "Mudanças gerais" (muito vago)
- ❌ RUIM: Esperar dias pra fazer um commit gigante

**Quanto mais você commitar, menos chances de perder código!** 🎉 