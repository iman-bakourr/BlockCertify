# BlockCertify — Blockchain-Based Academic Certificate Verification System
Blockchain-Based Academic Certificate Verification System

## Team Members
- BAKOUR IMAN
- ALIN FARHAIN BINTI ABDUL RAJAT @ ABDUL RAZAK
- AMYSHA QISTINA BINTI AMEROLAZUAM 
- SHARIFAH SHERIL DAMIA BINTI SYED IZZUDDIN
- SHARIFAH ZAHIDAH BINTI SYED ABDUL RAHMAN

## Structure

```
certichain/
├── contracts/CertiChain.sol     # Solidity smart contract (CEI pattern)
├── test/CertiChain.test.js      # Hardhat tests
├── scripts/deploy.js            # Deployment script
├── hardhat.config.js
├── package.json                 # Hardhat / contracts dependencies
├── backend/                      # Express + ethers.js API server
│   ├── server.js
│   ├── blockchain.js             # Web3 layer (ethers.js)
│   ├── db.js                     # Off-chain metadata store
│   ├── contractInfo.js
│   └── routes/
│       ├── university.js
│       ├── student.js
│       └── employer.js
└── frontend/                     # React (Vite) app
    └── src/
        ├── App.jsx
        ├── api.js                # Backend REST client
        ├── useWeb3.js            # MetaMask / ethers.js hook
        └── pages/
            ├── Home.jsx              (Figure 3 - Dashboard)
            ├── UniversityLogin.jsx   (Figure 4)
            ├── UniversityDashboard.jsx (Figure 5)
            ├── StudentLogin.jsx      (Figure 6)
            ├── StudentPortal.jsx     (Figure 7)
            └── EmployerPortal.jsx    (Figure 8)
```

## 1. Smart contract (Hardhat)

```bash
cd certichain
npm install
npx hardhat compile
npx hardhat test

# In one terminal: start a local blockchain
npx hardhat node

# In another terminal: deploy the contract
npm run deploy:local
```

This writes `deployments/CertiChain.json` containing the deployed address and ABI,
used by both the backend and frontend.

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env:
#  - RPC_URL=http://127.0.0.1:8545 (from `npx hardhat node`)
#  - PRIVATE_KEY=<one of the test account keys printed by hardhat node>
#  - CONTRACT_ADDRESS=<address from deployments/CertiChain.json>
npm run dev
```

The backend exposes:
- `POST /api/university/login`, `GET /api/university/dashboard`, `POST/GET /api/university/certificates`
- `POST /api/student/login`, `GET /api/student/certificates?studentId=...`
- `POST /api/employer/verify`
- `GET /api/status`

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_CONTRACT_ADDRESS to the deployed contract address
npm run dev
```

Open `http://localhost:5173`. Three entry points match the proposal:
- **University Admin Portal** — login (any credentials, demo) → issue certificates
  (either via the backend relayer wallet, or by signing directly with MetaMask)
- **Student Portal** — search by Student ID → view, download, copy hash/share link
- **Employer Verification Portal** — verify "By Hash" or "By Details" against the
  blockchain ledger

## Security notes (per Milestones 1–2 of the assignment)

- `CertiChain.sol` follows the **Checks-Effects-Interactions (CEI)** pattern in
  every state-changing function.
- Only addresses in `authorizedIssuers` can call `issueCertificate` (Certificate
  Upload Validation).
- Certificates are immutable once stored — no update/delete functions exist.
- `verifyCertificate` includes a simple rate limit (Verification Attempt Limit)
  and emits `InvalidCertificateAlert` / `MultipleFailedVerificationAlert` events.
- Only the certificate hash (not full personal data) is stored on-chain; full
  details live in the backend's off-chain store (Privacy Protection Rules).
