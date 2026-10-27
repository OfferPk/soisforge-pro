\# SOISForge Pro (v1.0.0)  
\#\#\# CCSDS 135.0-B-1 & ISO 10537 Spacecraft Onboard Interface Services (SOIS) Studio & Avionics Bus Master

SOISForge Pro is an aerospace-grade developer studio, Subnetwork Memory Access (SMAS) master, Subnetwork Packet Service (SPS) multiplexer, Device Virtualization (DVS) engine, and 10-point normative compliance auditor designed for spacecraft flight avionics architectures (NASA Core Flight System / cFS, ESA SAVOIR, and modular smallsat buses).

\---

\#\# 🌟 Key Capabilities  
\- \*\*Subnetwork Memory Access Service (SMAS)\*\*: Word-aligned 32-bit atomic read and write primitives (\`READ.request\`, \`WRITE.request\`) over subnetwork device address spaces.  
\- \*\*Subnetwork Packet Service (SPS)\*\*: Channelized raw packet transmission with configurable Quality of Service (QoS) priorities.  
\- \*\*Device Virtualization Service (DVS)\*\*: Standardizes hardware sensors (star trackers, IMUs, magnetometers) and actuators (reaction wheels, torque rods) into vendor-neutral virtual device classes.  
\- \*\*Device Data Pooling Service (DDPS)\*\*: Cached telemetry data pool that serves fresh sensor data to flight software applications without bus thrashing or excessive polling.  
\- \*\*Subnetwork Device Discovery (SDDS)\*\*: Plug-and-play detection and state management for instruments joining or leaving the onboard bus.  
\- \*\*10-Point Normative Auditor\*\*: Automated verification engine enforcing rules \`SOIS-001\` through \`SOIS-010\` per official CCSDS Blue Book standards.

\---

\#\# 📂 Project Structure  
\`\`\`text  
sois-forge-pro/  
├── source-code/  
│   ├── sois-engine.js           \# Core SOIS SMAS, SPS, DVS & DDPS engine  
│   ├── sois-auditor.js          \# 10-point normative compliance auditor  
│   ├── sois\_cli.py              \# Python 3 CLI executable  
│   ├── sois-cli.py              \# Python 3 CLI alias  
│   ├── test\_runner.py           \# 10-suite unit test runner  
│   └── index.html               \# Interactive Mission Control operations console  
├── build/  
│   └── sois-forge-pro-v1.0.0.zip \# Standalone production bundle  
├── documentation/  
│   ├── CCSDS\_SOIS\_SPECIFICATION.md \# Normative protocol specification  
│   └── SOIS\_COMPLIANCE\_MATRIX.md   \# 10-point requirement traceability  
└── screenshots/  
    ├── architecture-diagram.svg    \# System architecture diagram  
    └── sois-studio-preview.svg     \# Operations studio interface preview  
\`\`\`

\---

\#\# 🚀 Quick Start

\#\#\# Running Automated Tests  
\`\`\`bash  
python3 source-code/test\_runner.py \-v  
\`\`\`

\#\#\# Command Line Interface  
\`\`\`bash  
\# Read register offset 0x0004 from StarTracker at address 0x10  
python3 source-code/sois\_cli.py \--mode smas-read \--address 0x10 \--offset 0x0004

\# Write value 100 to ReactionWheel offset 0x0008 at address 0x20  
python3 source-code/sois\_cli.py \--mode smas-write \--address 0x20 \--offset 0x0008 \--val 100

\# Run 10-Point Normative Compliance Audit  
python3 source-code/sois\_cli.py \--mode audit  
\`\`\`

\#\#\# Launching the Web Operations Console  
Open \`source-code/index.html\` in any modern web browser to access live virtual device rack monitoring, memory-mapped register inspection, data pool browsing, and compliance scorecard auditing.  
