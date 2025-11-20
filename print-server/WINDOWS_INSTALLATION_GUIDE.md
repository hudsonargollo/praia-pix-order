# Guia de Instalação - Servidor de Impressão (Windows)

## 📋 Visão Geral

Este guia explica como instalar e configurar o servidor de impressão local para impressoras térmicas no Windows. O servidor permite que comandas de cozinha sejam impressas automaticamente quando pedidos são confirmados.

## ✅ Requisitos

- **Windows** 10 ou 11
- **Node.js** 16 ou superior
- **Impressora Térmica USB** (compatível com ESC/POS)
- **Cabo USB** para conectar a impressora
- **Privilégios de Administrador** (para instalação como serviço)

## 📦 Passo 1: Instalar Node.js

1. Acesse [https://nodejs.org](https://nodejs.org)
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador
4. Siga as instruções na tela
5. **Importante**: Marque a opção "Automatically install the necessary tools"

### Verificar Instalação

Abra o **Prompt de Comando** (cmd) e digite:

```cmd
node --version
```

Deve mostrar algo como: `v18.17.0` ou superior

```cmd
npm --version
```

Deve mostrar algo como: `9.6.7` ou superior

## 🖨️ Passo 2: Conectar a Impressora

1. Conecte a impressora térmica via USB
2. Ligue a impressora
3. Aguarde o Windows reconhecer o dispositivo
4. **Não é necessário instalar drivers** - o servidor se comunica diretamente via USB

### Verificar Impressora

1. Abra o **Gerenciador de Dispositivos** (Win + X → Gerenciador de Dispositivos)
2. Procure por "Dispositivos USB" ou "Impressoras"
3. Verifique se a impressora aparece sem erros (sem ícone amarelo)

## 📁 Passo 3: Copiar Arquivos do Servidor

1. Localize a pasta `print-server` no repositório do projeto
2. Copie toda a pasta para um local permanente, por exemplo:
   ```
   C:\CocoLoko\print-server\
   ```
3. **Importante**: Não coloque em pastas temporárias ou na área de trabalho

### Estrutura de Arquivos

Certifique-se de que a pasta contém:

```
print-server/
├── server.js
├── install-service.js
├── uninstall-service.js
├── package.json
├── start-server.bat
├── install-windows-service.bat
├── uninstall-windows-service.bat
└── README.md
```

## 🚀 Passo 4: Instalar Dependências

1. Abra o **Prompt de Comando** como **Administrador**:
   - Pressione `Win + X`
   - Selecione "Terminal (Admin)" ou "Prompt de Comando (Admin)"

2. Navegue até a pasta do servidor:
   ```cmd
   cd C:\CocoLoko\print-server
   ```

3. Instale as dependências:
   ```cmd
   npm install
   ```

4. Aguarde a instalação (pode levar alguns minutos)

### Possíveis Erros

**Erro: "npm não é reconhecido"**
- Solução: Reinicie o computador após instalar o Node.js

**Erro: "node-gyp"**
- Solução: Execute `npm install --global windows-build-tools` (como administrador)

## ⚙️ Passo 5: Instalar como Serviço do Windows

### Opção A: Usando o Script (Recomendado)

1. Localize o arquivo `install-windows-service.bat`
2. **Clique com botão direito** no arquivo
3. Selecione **"Executar como administrador"**
4. Aguarde a instalação
5. Quando aparecer "Installation Complete!", pressione qualquer tecla

### Opção B: Instalação Manual

1. Abra o **Prompt de Comando** como **Administrador**
2. Navegue até a pasta:
   ```cmd
   cd C:\CocoLoko\print-server
   ```
3. Execute:
   ```cmd
   node install-service.js
   ```

### Verificar Instalação do Serviço

1. Pressione `Win + R`
2. Digite `services.msc` e pressione Enter
3. Procure por **"Coco Loko Print Server"**
4. Verifique se o status é **"Em execução"**

## 🧪 Passo 6: Testar o Servidor

### Teste 1: Verificar se o Servidor Está Rodando

1. Abra um navegador
2. Acesse: `http://localhost:3001/health`
3. Deve mostrar:
   ```json
   {
     "status": "ok",
     "serverRunning": true,
     "printerConnected": true
   }
   ```

### Teste 2: Testar Impressão

1. Acesse o painel administrativo do Coco Loko
2. Vá em **Admin** → **Impressão**
3. Clique em **"Testar Conexão"**
4. Clique em **"Imprimir Teste"**
5. A impressora deve imprimir um recibo de teste

## 🔧 Configuração no Sistema

### No Painel Admin

1. Acesse o sistema Coco Loko
2. Faça login como administrador
3. Vá em **Admin** → **Impressão**
4. Verifique se a URL está: `http://localhost:3001`
5. Clique em **"Testar Conexão"**
6. Status deve mostrar **"Conectado"**

### Na Página da Cozinha

1. Acesse **Cozinha**
2. Ative o botão **"Impressão Automática"**
3. Quando um pedido for confirmado, a comanda será impressa automaticamente

## 🔄 Gerenciar o Serviço

### Iniciar o Serviço

```cmd
net start "Coco Loko Print Server"
```

Ou via interface gráfica:
1. `Win + R` → `services.msc`
2. Encontre "Coco Loko Print Server"
3. Clique com botão direito → **Iniciar**

### Parar o Serviço

```cmd
net stop "Coco Loko Print Server"
```

Ou via interface gráfica:
1. `Win + R` → `services.msc`
2. Encontre "Coco Loko Print Server"
3. Clique com botão direito → **Parar**

### Reiniciar o Serviço

```cmd
net stop "Coco Loko Print Server"
net start "Coco Loko Print Server"
```

Ou via interface gráfica:
1. `Win + R` → `services.msc`
2. Encontre "Coco Loko Print Server"
3. Clique com botão direito → **Reiniciar**

### Desinstalar o Serviço

1. **Clique com botão direito** em `uninstall-windows-service.bat`
2. Selecione **"Executar como administrador"**
3. Aguarde a desinstalação

## 🐛 Solução de Problemas

### Problema: Servidor não inicia

**Sintomas**: Serviço não aparece em "services.msc" ou não inicia

**Soluções**:
1. Verifique se o Node.js está instalado: `node --version`
2. Reinstale as dependências: `npm install`
3. Verifique os logs em: `C:\ProgramData\Coco Loko Print Server\daemon\`
4. Tente instalar novamente como administrador

### Problema: Impressora não detectada

**Sintomas**: `printerConnected: false` no status

**Soluções**:
1. Verifique a conexão USB
2. Certifique-se de que a impressora está ligada
3. Tente uma porta USB diferente
4. Reinicie o serviço
5. Verifique no Gerenciador de Dispositivos se há erros

### Problema: Impressão não funciona

**Sintomas**: Servidor conectado mas não imprime

**Soluções**:
1. Verifique se há papel na impressora
2. Teste com "Imprimir Teste" no painel admin
3. Clique em "Reconectar Impressora"
4. Reinicie a impressora
5. Reinicie o serviço

### Problema: Porta 3001 em uso

**Sintomas**: Erro "Port 3001 is already in use"

**Soluções**:
1. Verifique se há outra instância rodando
2. Pare o serviço: `net stop "Coco Loko Print Server"`
3. Ou altere a porta em `server.js` (linha 7)

### Problema: Permissões negadas

**Sintomas**: Erro de permissão ao instalar

**Soluções**:
1. Execute como administrador
2. Desative temporariamente o antivírus
3. Verifique as configurações de UAC do Windows

## 📊 Logs e Monitoramento

### Localização dos Logs

Quando instalado como serviço, os logs ficam em:
```
C:\ProgramData\Coco Loko Print Server\daemon\
```

Arquivos de log:
- `coco-loko-print-server.out.log` - Saída padrão
- `coco-loko-print-server.err.log` - Erros

### Visualizar Logs em Tempo Real

1. Abra o Prompt de Comando como Administrador
2. Execute:
   ```cmd
   cd C:\ProgramData\Coco Loko Print Server\daemon
   type coco-loko-print-server.out.log
   ```

## 🔐 Segurança

- O servidor roda apenas em `localhost` (não acessível pela rede)
- Não requer autenticação (acesso local apenas)
- Roda com privilégios de sistema (necessário para acesso USB)
- CORS habilitado apenas para localhost

## 🆘 Suporte

### Informações para Suporte

Ao solicitar ajuda, forneça:

1. Versão do Windows: `winver`
2. Versão do Node.js: `node --version`
3. Status do serviço: `sc query "Coco Loko Print Server"`
4. Logs do servidor (últimas 50 linhas)
5. Modelo da impressora
6. Mensagem de erro completa

### Comandos Úteis

```cmd
REM Verificar status do serviço
sc query "Coco Loko Print Server"

REM Ver logs do serviço
type "C:\ProgramData\Coco Loko Print Server\daemon\coco-loko-print-server.out.log"

REM Testar conexão
curl http://localhost:3001/health

REM Listar processos Node.js
tasklist | findstr node
```

## ✅ Checklist de Instalação

- [ ] Node.js instalado e funcionando
- [ ] Impressora conectada via USB e ligada
- [ ] Pasta `print-server` copiada para local permanente
- [ ] Dependências instaladas (`npm install`)
- [ ] Serviço instalado como administrador
- [ ] Serviço aparece em `services.msc` como "Em execução"
- [ ] Teste de conexão bem-sucedido (`http://localhost:3001/health`)
- [ ] Impressão de teste funcionando
- [ ] Configurado no painel admin
- [ ] Impressão automática ativada na cozinha

## 🎉 Conclusão

Após seguir todos os passos, o servidor de impressão estará:

✅ Instalado como serviço do Windows
✅ Iniciando automaticamente com o Windows
✅ Conectado à impressora térmica
✅ Pronto para imprimir comandas automaticamente

Para uso diário, basta:
1. Ligar o computador
2. Ligar a impressora
3. O servidor inicia automaticamente
4. Ativar "Impressão Automática" na página da cozinha

**Pronto! O sistema está configurado e funcionando! 🎊**
