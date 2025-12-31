# BetFun Quick Start Guide

Get BetFun running locally in under 10 minutes!

---

## 1. Prerequisites Check

Ensure you have these installed:

```bash
# Check Node.js (need v18+)
node --version

# Check MongoDB is running
mongosh
# Type 'exit' to quit

# If MongoDB not installed, install it:
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
# Windows: https://www.mongodb.com/try/download/community
```

---

## 2. Install Dependencies

```bash
# From the BetFun root directory

# Backend
cd BackEnd
npm install

# Frontend
cd ../FrontEnd
npm install
```

---

## 3. Set Up Environment Variables

### Backend (.env)

```bash
cd BackEnd
cp env.example .env
```

Edit `BackEnd/.env` with these minimum values:

```env
PORT=8080
DB_URL=mongodb://localhost:27017/betfun
PASSKEY=dev_passkey_123
FEE_AUTHORITY=11111111111111111111111111111111
SOLANA_RPC=https://api.devnet.solana.com
GATE_TOKEN_MINT=11111111111111111111111111111111
ADMIN_WALLET=YOUR_PHANTOM_WALLET_ADDRESS_HERE
```

**Important**: Replace `YOUR_PHANTOM_WALLET_ADDRESS_HERE` with your actual Phantom wallet address.

### Frontend (.env.local)

```bash
cd ../FrontEnd
cp .env.example .env.local
```

Edit `FrontEnd/.env.local`:

```env
NEXT_PUBLIC_GATE_TOKEN_MINT=11111111111111111111111111111111
```

---

## 4. Start MongoDB

### macOS
```bash
brew services start mongodb-community
```

### Linux
```bash
sudo systemctl start mongod
```

### Windows
```bash
net start MongoDB
```

Verify it's running:
```bash
mongosh
# Should connect successfully, then type: exit
```

---

## 5. Start Backend Server

Open **Terminal 1**:

```bash
cd BackEnd
npm run dev
```

You should see:
```
Server is running on port 8080: http://localhost:8080
MONGODB CONNECTED : localhost:27017
```

**Keep this terminal running!**

---

## 6. Start Frontend Application

Open **Terminal 2** (new terminal window):

```bash
cd FrontEnd
npm run dev
```

You should see:
```
▲ Next.js 15.2.1
- Local:        http://localhost:3000
```

**Keep this terminal running!**

---

## 7. Open in Browser

Visit: **http://localhost:3000**

You should see the BetFun homepage!

---

## 8. Connect Your Wallet

1. Install Phantom wallet browser extension if you don't have it
2. Create/import a wallet
3. Switch to **Devnet**:
   - Open Phantom
   - Settings > Change Network > Devnet
4. Get free devnet SOL:
   - Visit https://faucet.solana.com
   - Paste your wallet address
   - Click "Airdrop 1 SOL"
5. On BetFun website, click "Connect Wallet"

---

## 9. Test the Application

### View Markets
- Navigate to **Home** page
- Browse existing markets (if any)

### Access Admin Panel
- Navigate to **Admin** in sidebar
- Only works if your wallet matches `ADMIN_WALLET` in backend `.env`
- You can resolve test markets here

### View Claims
- Navigate to **ClaimWinnings** in sidebar
- See resolved markets where you can claim (after smart contract deployment)

### Create Market (Requires Tokens)
- Navigate to **ProposeMarket** in sidebar
- Note: You need 500,000 of the gate token to create markets
- For testing, you can disable this (see below)

---

## 10. Disable Token Gating for Testing (Optional)

If you want to test market creation without tokens:

**Backend** - Edit `BackEnd/src/config.ts`:
```typescript
export const tokenGateConfig = {
  enabled: false,  // Change to false
  // ... rest of config
}
```

**Frontend** - Edit `FrontEnd/src/utils/index.ts`:
```typescript
export const TOKEN_GATE_CONFIG = {
  enabled: false,  // Change to false
  // ... rest of config
};
```

Restart both backend and frontend servers.

---

## Troubleshooting

### Backend won't start

**"Cannot connect to MongoDB"**
```bash
# Make sure MongoDB is running
mongosh

# If connection fails, start MongoDB:
brew services start mongodb-community  # macOS
sudo systemctl start mongod             # Linux
```

**"Port 8080 already in use"**
```bash
# Change port in BackEnd/.env
PORT=9000

# Update frontend URL in FrontEnd/src/data/data.ts
export const url = "http://localhost:9000/"
```

### Frontend won't start

**"Port 3000 already in use"**
```bash
npm run dev -- -p 3001
# Then visit http://localhost:3001
```

**"Cannot connect to backend"**
- Verify backend is running (Terminal 1 should show server running)
- Check `FrontEnd/src/data/data.ts` URL matches backend port

### Wallet issues

**"Network mismatch"**
- Open Phantom
- Settings > Change Network > Devnet
- Refresh the page

**"Insufficient funds"**
- Visit https://faucet.solana.com
- Airdrop devnet SOL to your wallet

---

## Next Steps

Once you have everything running:

1. **Read the full documentation**: `LOCAL_DEVELOPMENT.md`
2. **Check deployment readiness**: `DEPLOYMENT_CHECKLIST.md`
3. **Explore the codebase**:
   - Backend API: `BackEnd/src/controller/`
   - Frontend pages: `FrontEnd/src/app/`
   - Smart contract: `prediction-market-smartcontract/programs/prediction/src/`

---

## Daily Development Workflow

```bash
# Terminal 1 - Backend
cd BackEnd
npm run dev

# Terminal 2 - Frontend
cd FrontEnd
npm run dev

# Browse to http://localhost:3000
# Make changes in your code editor
# Both will auto-reload on save!
```

---

## Getting Help

- **Full setup guide**: See `LOCAL_DEVELOPMENT.md`
- **Deployment checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Main README**: See `Readme.md`
- **GitHub Issues**: Report bugs or ask questions
- **Telegram**: @blacksky_jose
- **Twitter**: @blacksky_jose

---

**Happy coding! 🚀**
