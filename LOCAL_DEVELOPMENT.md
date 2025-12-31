# BetFun Local Development Guide

Complete guide for setting up and running BetFun locally on your machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```
   Download from: https://nodejs.org/

2. **MongoDB**
   - **Option A - Local Installation**: https://www.mongodb.com/try/download/community
   - **Option B - MongoDB Atlas** (Cloud): https://www.mongodb.com/cloud/atlas

   To check if MongoDB is running locally:
   ```bash
   mongosh  # Should connect to mongodb://localhost:27017
   ```

3. **Solana CLI** (for smart contract development)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   solana --version
   ```

4. **Anchor CLI** (v0.29.0 for smart contracts)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install 0.29.0
   avm use 0.29.0
   anchor --version
   ```

5. **Rust** (for smart contract development)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustc --version
   ```

6. **Package Manager** (npm or yarn)
   ```bash
   npm --version
   # or
   yarn --version
   ```

---

## Project Structure

```
BetFun/
├── BackEnd/              # Express API server
├── FrontEnd/             # Next.js application
├── prediction-market-smartcontract/  # Anchor/Rust smart contract
├── LOCAL_DEVELOPMENT.md  # This file
└── DEPLOYMENT_CHECKLIST.md
```

---

## Step 1: Clone and Install

### 1.1 Clone the Repository (if not already done)

```bash
git clone <your-repo-url>
cd BetFun
```

### 1.2 Install Backend Dependencies

```bash
cd BackEnd
npm install
# or
yarn install
```

Expected dependencies:
- Express 5
- Mongoose 8
- Solana Web3.js
- Anchor
- TypeScript

### 1.3 Install Frontend Dependencies

```bash
cd ../FrontEnd
npm install
# or
yarn install
```

Expected dependencies:
- Next.js 15.2.1
- React 19
- Solana Wallet Adapter
- TailwindCSS 4.0

### 1.4 Install Smart Contract Dependencies

```bash
cd ../prediction-market-smartcontract
npm install
# or
yarn install
```

---

## Step 2: Configure Environment Variables

### 2.1 Backend Environment Variables

Create a `.env` file in the `BackEnd` directory:

```bash
cd BackEnd
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=8080

# MongoDB Connection
DB_URL=mongodb://localhost:27017/betfun
# Or for MongoDB Atlas:
# DB_URL=mongodb+srv://username:password@cluster.mongodb.net/betfun?retryWrites=true&w=majority

# Security
PASSKEY=your_secure_passkey_here

# Solana Configuration
FEE_AUTHORITY=your_fee_wallet_public_key
SOLANA_RPC=https://api.devnet.solana.com
# For faster development, consider using a paid RPC:
# SOLANA_RPC=https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY

# Token Gating Configuration
GATE_TOKEN_MINT=your_spl_token_mint_address
# Example: GATE_TOKEN_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Admin Wallet for Market Resolution
ADMIN_WALLET=your_admin_wallet_public_key
# This should be your Phantom wallet address that can resolve markets
```

**Important Notes:**
- `PORT=8080` must match the frontend's API URL (`http://localhost:8080/`)
- `DB_URL` for local MongoDB is typically `mongodb://localhost:27017/betfun`
- `ADMIN_WALLET` should be your actual Solana wallet address
- `GATE_TOKEN_MINT` is the SPL token address for token-gating (500k tokens required to create markets)

### 2.2 Frontend Environment Variables

Create a `.env.local` file in the `FrontEnd` directory:

```bash
cd ../FrontEnd
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Token Gating Configuration
# Must match the GATE_TOKEN_MINT in backend .env
NEXT_PUBLIC_GATE_TOKEN_MINT=your_spl_token_mint_address
```

### 2.3 Verify Backend URL Configuration

The frontend is configured to use `http://localhost:8080/` by default. This is set in:
- `FrontEnd/src/data/data.ts` line 71: `export const url = "http://localhost:8080/"`

Make sure this matches your backend `PORT` in `.env`.

---

## Step 3: Start MongoDB

### Option A: Local MongoDB

If you installed MongoDB locally, start it:

**macOS:**
```bash
brew services start mongodb-community
# or
mongod --config /usr/local/etc/mongod.conf
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

Verify it's running:
```bash
mongosh
# Should connect successfully
```

### Option B: MongoDB Atlas (Cloud)

If using MongoDB Atlas, ensure your connection string in `BackEnd/.env` includes:
- Correct username/password
- Database name: `betfun`
- Network access allows your IP

---

## Step 4: Start the Backend Server

```bash
cd BackEnd

# Development mode with hot reload
npm run dev
# or
yarn dev
```

Expected output:
```
Server listening on port 8080
MongoDB connected successfully
```

**Troubleshooting:**
- **Port already in use**: Change `PORT` in `.env` to another port (e.g., 9000) and update frontend URL
- **MongoDB connection error**: Check MongoDB is running and `DB_URL` is correct
- **Module not found**: Run `npm install` again

---

## Step 5: Start the Frontend Application

Open a **new terminal window**:

```bash
cd FrontEnd

# Development mode
npm run dev
# or
yarn dev
```

Expected output:
```
▲ Next.js 15.2.1
- Local:        http://localhost:3000
- Ready in 2.1s
```

Open your browser to: **http://localhost:3000**

**Troubleshooting:**
- **Port 3000 already in use**: Stop other Next.js apps or use `npm run dev -- -p 3001`
- **Module not found**: Run `npm install` again
- **API connection error**: Verify backend is running on port 8080

---

## Step 6: Build and Deploy Smart Contract (Optional)

Only needed if you're modifying smart contract logic or deploying for the first time.

### 6.1 Configure Solana for Devnet

```bash
solana config set --url devnet
solana config get  # Verify RPC URL is https://api.devnet.solana.com
```

### 6.2 Create/Fund a Wallet

```bash
# Generate a new keypair (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# Get your address
solana address

# Fund with devnet SOL (airdrop)
solana airdrop 2
solana balance
```

### 6.3 Build the Smart Contract

```bash
cd prediction-market-smartcontract

# Build
anchor build
```

Expected output:
```
✔ Built program: target/deploy/prediction.so
```

### 6.4 Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

Expected output:
```
Deploying cluster: https://api.devnet.solana.com
Program Id: <YOUR_PROGRAM_ID>
Deploy success
```

### 6.5 Update Program IDs

After deployment, copy the Program ID and update in:

1. **Smart Contract Config**:
   ```bash
   # Edit prediction-market-smartcontract/Anchor.toml
   # Update [programs.devnet] section with new program ID
   ```

2. **Backend SDK**:
   ```bash
   # Edit BackEnd/src/prediction_market_sdk/constants.ts
   # Update PROGRAM_ID with new address
   ```

3. **Frontend SDK**:
   ```bash
   # Edit FrontEnd/src/components/prediction_market_sdk/constants.ts
   # Update PROGRAM_ID with new address
   ```

### 6.6 Copy IDL Files

```bash
# From prediction-market-smartcontract directory
cp target/idl/prediction.json ../BackEnd/src/prediction_market_sdk/idl/
cp target/idl/prediction.json ../FrontEnd/src/components/prediction_market_sdk/idl/
```

### 6.7 Run Tests (Optional)

```bash
anchor test
```

---

## Step 7: Verify Everything is Working

### 7.1 Check Services Status

Open three terminal windows and verify:

**Terminal 1 - Backend**:
```bash
cd BackEnd
npm run dev
# Should show: Server listening on port 8080
```

**Terminal 2 - Frontend**:
```bash
cd FrontEnd
npm run dev
# Should show: Local: http://localhost:3000
```

**Terminal 3 - MongoDB** (if local):
```bash
mongosh
show dbs
# Should list databases
```

### 7.2 Test Frontend Access

1. Open http://localhost:3000
2. You should see the BetFun homepage
3. Click "Connect Wallet" (install Phantom wallet if needed)
4. Navigate through pages: Home, FundMarket, ProposeMarket, ClaimWinnings, Profile, About

### 7.3 Test Backend API

```bash
# Test health endpoint (if exists)
curl http://localhost:8080/api/market/get?marketStatus=ACTIVE&limit=10

# Should return JSON with markets array
```

### 7.4 Test Smart Contract Connection

In the frontend:
1. Connect your Phantom wallet (switch to Devnet in wallet settings)
2. Navigate to "ProposeMarket"
3. Try creating a test market (you'll need 500k tokens for token-gating to pass)

---

## Common Development Tasks

### Reset Database

```bash
mongosh
use betfun
db.dropDatabase()
```

### View Backend Logs

Backend logs appear in the terminal where `npm run dev` is running. Watch for:
- MongoDB connection status
- API request logs
- Error stack traces

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Edit any file in `FrontEnd/src/` and changes appear automatically
- **Backend**: Edit any file in `BackEnd/src/` and server restarts automatically (using ts-node-dev)

### Clear Next.js Cache

If frontend behaves strangely:
```bash
cd FrontEnd
rm -rf .next
npm run dev
```

### Rebuild Smart Contract

```bash
cd prediction-market-smartcontract
anchor clean
anchor build
```

---

## Development Workflow

### Typical Daily Workflow

1. **Start MongoDB**:
   ```bash
   brew services start mongodb-community  # macOS
   # or ensure Atlas connection works
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd BackEnd
   npm run dev
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   cd FrontEnd
   npm run dev
   ```

4. **Code and Test**:
   - Make changes in your editor
   - Both backend and frontend auto-reload
   - Test in browser at http://localhost:3000

5. **Test Smart Contract Changes** (if needed):
   ```bash
   cd prediction-market-smartcontract
   anchor build
   anchor deploy
   # Copy new IDL files
   # Restart backend and frontend
   ```

---

## Testing the Complete Flow

### 1. Create a Market

1. Navigate to http://localhost:3000/propose
2. Connect wallet (must have 500k tokens)
3. Fill in market details
4. Submit transaction
5. Check backend logs for market creation

### 2. Add Liquidity

1. Navigate to http://localhost:3000/fund
2. Select a pending market
3. Add SOL liquidity
4. Market should become ACTIVE

### 3. Place Bets

1. Navigate to home page
2. Find an active market
3. Bet on YES or NO
4. Confirm transaction

### 4. Resolve Market (Admin)

1. Navigate to http://localhost:3000/admin/resolve
2. Connect admin wallet (must match `ADMIN_WALLET` in backend `.env`)
3. Click "Resolve as YES" or "Resolve as NO"
4. Sign transaction

### 5. Claim Winnings

1. Navigate to http://localhost:3000/claim
2. View resolved markets
3. Click "Claim Winnings" if you won
4. Sign transaction to receive SOL

---

## Troubleshooting

### Backend Won't Start

**Error: Cannot connect to MongoDB**
- Check MongoDB is running: `mongosh`
- Verify `DB_URL` in `.env` is correct
- For local: `mongodb://localhost:27017/betfun`
- For Atlas: Check connection string, username, password, IP whitelist

**Error: Port 8080 already in use**
- Change `PORT` in `BackEnd/.env` to another port (e.g., 9000)
- Update `FrontEnd/src/data/data.ts` line 71 to match new port

**Error: Module not found**
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `npm install`

### Frontend Won't Start

**Error: Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

**Error: Cannot connect to backend**
- Verify backend is running on port 8080
- Check browser console for CORS errors
- Verify `url` in `FrontEnd/src/data/data.ts` is correct

**Error: Wallet connection fails**
- Install Phantom wallet browser extension
- Switch Phantom to Devnet (Settings > Change Network > Devnet)
- Refresh page

### Smart Contract Issues

**Error: Program deploy failed**
- Check you have enough SOL: `solana balance`
- Airdrop more: `solana airdrop 2`
- Verify you're on devnet: `solana config get`

**Error: Transaction simulation failed**
- Smart contract may not be deployed yet
- Check program ID matches in backend/frontend constants
- Verify IDL files are up to date

### Token Gating Issues

**Cannot create market - insufficient tokens**
- You need 500,000 tokens at the address: `GATE_TOKEN_MINT`
- For testing, you can disable token gating:
  - Backend: `BackEnd/src/config.ts` - set `enabled: false`
  - Frontend: `FrontEnd/src/utils/index.ts` - set `enabled: false`

**Token balance shows 0 but I have tokens**
- Verify `GATE_TOKEN_MINT` matches in both backend and frontend `.env`
- Check wallet is connected to correct network (Devnet)
- Verify token account exists: use Solana Explorer

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `8080` | Backend server port |
| `DB_URL` | Yes | `mongodb://localhost:27017/betfun` | MongoDB connection |
| `PASSKEY` | Yes | `your_secret_key` | API security key |
| `FEE_AUTHORITY` | Yes | `Hx7W...` | Fee collection wallet |
| `SOLANA_RPC` | Yes | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `GATE_TOKEN_MINT` | Yes | `EPjF...` | Token for gating |
| `ADMIN_WALLET` | Yes | `9tZk...` | Admin wallet address |

### Frontend (.env.local)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_GATE_TOKEN_MINT` | Yes | `EPjF...` | Must match backend |

---

## Quick Reference Commands

### Backend
```bash
cd BackEnd
npm run dev          # Start development server
npm start            # Start production server
npm run build        # Build TypeScript
```

### Frontend
```bash
cd FrontEnd
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Smart Contract
```bash
cd prediction-market-smartcontract
anchor build         # Build program
anchor test          # Run tests
anchor deploy        # Deploy to configured cluster
anchor clean         # Clean build artifacts
```

### Solana
```bash
solana config set --url devnet        # Switch to devnet
solana config set --url mainnet-beta  # Switch to mainnet
solana balance                        # Check wallet balance
solana airdrop 2                      # Get 2 devnet SOL
solana address                        # Show wallet address
```

### MongoDB
```bash
mongosh                               # Connect to local MongoDB
mongosh "mongodb+srv://..."           # Connect to Atlas
show dbs                              # List databases
use betfun                            # Switch to betfun DB
db.markets.find()                     # View all markets
db.dropDatabase()                     # Delete current DB
```

---

## Next Steps

Once your local environment is running:

1. **Read the main README.md** for feature documentation
2. **Check DEPLOYMENT_CHECKLIST.md** for production deployment steps
3. **Explore the codebase**:
   - `BackEnd/src/controller/` - API business logic
   - `FrontEnd/src/app/` - Next.js pages
   - `prediction-market-smartcontract/programs/prediction/src/` - Smart contract

4. **Join the community**:
   - GitHub: Check issues and discussions
   - Telegram: @blacksky_jose
   - Twitter: @blacksky_jose

---

## Getting Help

If you encounter issues not covered here:

1. Check the **DEPLOYMENT_CHECKLIST.md** for additional troubleshooting
2. Review error logs in terminal output
3. Search GitHub issues
4. Contact the maintainers

**Common Support Channels**:
- GitHub Issues: Report bugs and feature requests
- Telegram: Quick questions and community support
- Twitter: Updates and announcements

---

**Last Updated**: December 30, 2025
**BetFun Version**: 1.0.0
**Tested on**: macOS, Linux, Windows WSL
