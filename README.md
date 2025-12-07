# Sejm Info

Platforma analityczna do śledzenia procesów legislacyjnych w Polskim Sejmie.

## 🏗️ Struktura Projektu

- **sejm-web**: Frontend (Next.js 15, React 19, TailwindCSS)
- **sejm-sync-service**: Backend do synchronizacji danych (Node.js, TypeScript)
- **sejm-ml-service**: Serwis AI/ML do analizy ustaw (Python, FastAPI)
- **ansible**: Skrypty wdrożeniowe

## 🚀 Wdrożenie (CI/CD)

Projekt wykorzystuje **Self-Hosted GitHub Runner** uruchamiany na lokalnej maszynie deweloperskiej (MacBook M1/M2/M3) do budowania obrazów Docker (obsługa multi-arch) oraz Ansible do wdrażania na DigitalOcean.

### Wymagania wstępne
1. **Docker Desktop** musi być uruchomiony w tle.
2. Skonfigurowane sekrety w GitHub Repository Secrets.

### Jak uruchomić Runnera?

Aby pipeline `deploy.yml` zadziałał, runner musi "nasłuchiwać" na zadania.

**Opcja A: Uruchomienie w terminalu (Interaktywnie)**
Runner będzie działał dopóki nie zamkniesz terminala.

```bash
cd actions-runner
./run.sh
```

**Opcja B: Uruchomienie jako serwis (W tle)**
Runner będzie działał automatycznie w tle.

```bash
cd actions-runner
./svc.sh install  # Instalacja serwisu (tylko raz)
./svc.sh start    # Uruchomienie
./svc.sh status   # Sprawdzenie statusu
# ./svc.sh stop   # Zatrzymanie
```

## 🛠️ Development

### Uruchomienie lokalne

1. **Baza danych (Supabase)**
   Upewnij się, że masz URL i klucze do Supabase w `.env`.

2. **Backend (Sync Service)**
```bash
cd sejm-sync-service
npm install
npm run dev
```

3. **Frontend (Web)**
```bash
cd sejm-web
npm install
npm run dev
```
