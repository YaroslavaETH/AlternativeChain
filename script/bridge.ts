import { createPublicClient, createWalletClient, http, Abi, Address, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet, polygonAmoy } from "viem/chains";
// Используем стандартный импорт JSON с `assert { type: 'json' }`
import BridgeJson from '../abi/Bridge.json' assert { type: 'json' };
import IERC20Json from '../abi/IERC20.json' assert { type: 'json' };
// Импортируем dotenv для загрузки переменных окружения из файла .env
import 'dotenv/config';

const BRIDGE_BSC_ADDR = "0x0A8F04D29977f58FC452c69f115fd598C4B0bf6d" as Address;
const BRIDGE_POL_ADDR = "0x9decfb688cc336442a581d280e748a0909348a45" as Address;
const TOKEN_BSC_ADDR = "0x47728C8FC6FcE22aB0b939F28345A84c26f0178d" as Address;
const TOKEN_POL_ADDR = "0x768e550f12ab040bc2a5ec86ac6335b3396f4975" as Address;

// Проверяем, что приватный ключ существует в .env
if (!process.env.PRIVATE_KEY || !process.env.PRIVATE_KEY_CLIENT) {
    throw new Error("PRIVATE_KEY или PRIVATE_KEY_CLIENT не найдены в файле .env");
}

const ownerKey = (process.env.PRIVATE_KEY.startsWith('0x')
    ? process.env.PRIVATE_KEY
    : `0x${process.env.PRIVATE_KEY}`) as `0x${string}`;

const clientKey = (process.env.PRIVATE_KEY_CLIENT.startsWith('0x')
    ? process.env.PRIVATE_KEY_CLIENT
    : `0x${process.env.PRIVATE_KEY_CLIENT}`) as `0x${string}`;

const accountOwner = privateKeyToAccount(ownerKey);
const accountClient = privateKeyToAccount(clientKey);

const publicClientBSC = createPublicClient({
    chain: bscTestnet,
    transport: http(process.env.BSC_RPC_URL)
});

const publicClientPOL = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.POLYGON_RPC_URL)
});

const walletOwnerBSC = createWalletClient({
    account: accountOwner,
    chain: bscTestnet,
    transport: http(process.env.BSC_RPC_URL)
});

const walletOwnerPOL = createWalletClient({
    account: accountOwner,
    chain: polygonAmoy,
    transport: http(process.env.POLYGON_RPC_URL)
});

const walletClientBSC = createWalletClient({
    account: accountClient,
    chain: bscTestnet,
    transport: http(process.env.BSC_RPC_URL)
});

const walletClientPOL = createWalletClient({
    account: accountClient,
    chain: polygonAmoy,
    transport: http(process.env.POLYGON_RPC_URL)
});

// =================================================================================================
// Вспомогательные функции
// =================================================================================================

/**
 * Получает публичный клиент, соответствующий сети кошелька.
 */
function getPublicClientForWallet(
    walletClient: ReturnType<typeof createWalletClient>
): ReturnType<typeof createPublicClient> {
    if (walletClient.chain?.id === bscTestnet.id) return publicClientBSC;
    if (walletClient.chain?.id === polygonAmoy.id) return publicClientPOL;
    throw new Error(`Нет публичного клиента для сети: ${walletClient.chain?.name}`);
}

/**
 * Проверяет баланс нативной валюты (для оплаты газа).
 * Выбрасывает ошибку, если баланс равен нулю.
 */
async function checkNativeBalance(
    publicClient: ReturnType<typeof createPublicClient>,
    address: Address,
    chainName: string
): Promise<void> {
    const balance = await publicClient.getBalance({ address });
    console.log(`  Баланс нативной валюты (${chainName}): ${formatEther(balance)} (для оплаты газа)`);
    if (balance === 0n) {
        throw new Error(
            `Недостаточно нативной валюты на счете ${address} в сети ${chainName}.\n`
        );
    }
}

// =================================================================================================
// Функции отправки от имени пользователя
// =================================================================================================

/**
 * Отправляет токены из одной сети в другую (выполняет approve и lock).
 * Это функция, которую должен вызывать конечный пользователь.
 */
async function sendTokens(
    walletClient: ReturnType<typeof createWalletClient>,
    bridgeFrom: Address,
    tokenFrom: Address,
    amount: bigint
) {
    const publicClient = getPublicClientForWallet(walletClient);
    const chainName = walletClient.chain?.name ?? "Unknown";
    const senderAddress = walletClient.account?.address as Address;

    // --- Предварительная проверка баланса ---
    console.log(`\n[${chainName}] Проверка балансов для ${senderAddress}...`);
    await checkNativeBalance(publicClient, senderAddress, chainName);

    const tokenBalance = await publicClient.readContract({
        abi: IERC20Json.abi as Abi,
        address: tokenFrom,
        functionName: "balanceOf",
        args: [senderAddress]
    }) as bigint;
    console.log(`  Баланс токенов: ${formatEther(tokenBalance)}`);

    if (tokenBalance < amount) {
        throw new Error(
            `Недостаточно токенов. Нужно: ${formatEther(amount)}, доступно: ${formatEther(tokenBalance)}`
        );
    }

    // --- Approve ---
    try {
        console.log(`\n[${chainName}] Шаг 1: Отправка транзакции approve...`);

        const approveHash = await walletClient.writeContract({
            abi: IERC20Json.abi as Abi,
            address: tokenFrom,
            functionName: "approve",
            args: [bridgeFrom, amount]
        });
        console.log(`  Транзакция approve отправлена! Хэш: ${approveHash}`);

        // Ждём подтверждения перед следующим шагом
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log(`  Approve подтверждён.`);
    } catch (error) {
        console.error("Ошибка при approve:", error);
        throw new Error(`Ошибка при approve: ${error}`);
    }

    // --- Lock ---
    try {
        console.log(`[${chainName}] Шаг 2: Отправка транзакции lock...`);

        const lockHash = await walletClient.writeContract({
            abi: BridgeJson.abi as Abi,
            address: bridgeFrom,
            functionName: "lock",
            args: [amount]
        });
        console.log(`  Транзакция lock отправлена! Хэш: ${lockHash}`);

        await publicClient.waitForTransactionReceipt({ hash: lockHash });
        console.log(`  Lock подтверждён. Токены успешно заблокированы!`);
    } catch (error) {
        console.error("Ошибка при lock:", error);
        throw new Error(`Ошибка при lock: ${error}`);
    }
}

// =================================================================================================
// Функции слушатели
// =================================================================================================

/**
 * Запускает постоянное прослушивание событий в одной сети и отправляет транзакции в другую.
 * Эту функцию должен запускать владелец моста (релеер).
 */
async function startListener(
    publicClientFrom: ReturnType<typeof createPublicClient>,
    bridgeFrom: Address,
    bridgeTo: Address,
    walletOwnerTo: ReturnType<typeof createWalletClient>
) {
    const fromChain = publicClientFrom.chain?.name ?? "Unknown";
    const toChain = walletOwnerTo.chain?.name ?? "Unknown";
    console.log(`Слушатель запущен: ${fromChain} → ${toChain}`);
    console.log(`Ожидание событий BridgeLock на адресе ${bridgeFrom}...`);

    const publicClientTo = getPublicClientForWallet(walletOwnerTo);

    publicClientFrom.watchContractEvent({
        abi: BridgeJson.abi as Abi,
        address: bridgeFrom,
        eventName: "BridgeLock",
        onLogs: async (logs) => {
            for (const log of logs) {
                // Проверяем, что аргументы существуют, прежде чем их использовать
                if (!log.args?.user || !log.args?.amount) {
                    console.error("Событие без нужных аргументов:", log);
                    continue;
                }

                const { user, amount: lockedAmount } = log.args as { user: Address; amount: bigint };
                console.log(`Событие BridgeLock: пользователь ${user} заблокировал ${formatEther(lockedAmount)} токенов в ${fromChain}`);

                try {
                    console.log(`Отправляем unlock в ${toChain}...`);
                    const hash = await walletOwnerTo.writeContract({
                        abi: BridgeJson.abi as Abi,
                        address: bridgeTo,
                        functionName: "unlock",
                        args: [user, lockedAmount]
                    });
                    console.log(`  Unlock отправлен! Хэш: ${hash}`);

                    await publicClientTo.waitForTransactionReceipt({ hash });
                    console.log(`  Unlock подтверждён. Пользователь ${user} получил токены в ${toChain}.`);
                } catch (error) {
                    console.error("Ошибка при unlock:", error);
                }
            }
        }
    });
}

// =================================================================================================
// Функции для запуска
// =================================================================================================

// --- Функции для пользователя ---
async function sendFromBscToPol() {
    await sendTokens(walletClientBSC, BRIDGE_BSC_ADDR, TOKEN_BSC_ADDR, parseEther("11"));
}

async function sendFromPolToBsc() {
    await sendTokens(walletClientPOL, BRIDGE_POL_ADDR, TOKEN_POL_ADDR, parseEther("11"));
}

// --- Функции для владельца моста (релеера) ---
async function listenBscEvents() {
    // Слушаем BSC, отправляем в Polygon
    await startListener(publicClientBSC, BRIDGE_BSC_ADDR, BRIDGE_POL_ADDR, walletOwnerPOL);
}

async function listenPolEvents() {
    // Слушаем Polygon, отправляем в BSC
    await startListener(publicClientPOL, BRIDGE_POL_ADDR, BRIDGE_BSC_ADDR, walletOwnerBSC);
}

// --- Точка входа ---
async function main() {
    console.log("Скрипт запущен.");

    // --- Для пользователя ---
    await sendFromBscToPol();
    // await sendFromPolToBsc();

    // --- Для релеера ---
    // await listenBscEvents();
    // await listenPolEvents();
}

main().catch(error => {
    console.error("Критическая ошибка:", error);
    process.exit(1);
});
