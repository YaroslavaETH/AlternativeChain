import { createPublicClient, createWalletClient, http, Abi, Address, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet, polygonAmoy } from "viem/chains";
// Используем стандартный импорт JSON с `assert { type: 'json' }`
import BridgeJson from '../abi/Bridge.json' assert { type: 'json' };
import IERC20Json from '../abi/IERC20.json' assert { type: 'json' };
// Импортируем dotenv для загрузки переменных окружения из файла .env
import 'dotenv/config';

const BRIDGE_BSC_ADDR = "0x0CD517ba2C211BB1bA3a33CC959FF8764EaE39af" as Address;
const BRIDGE_POL_ADDR = "0xa2a00beCACd814DfaE89545c7109998F7fd87FB4" as Address;
const TOKEN_BSC_ADDR = "0xa2a00beCACd814DfaE89545c7109998F7fd87FB4" as Address;
const TOKEN_POL_ADDR = "0x48d6336828Cf62e5765885192e588cbCA7465532" as Address;

// Проверяем, что приватный ключ существует в .env
if (!process.env.PRIVATE_KEY || !process.env.PRIVATE_KEY_CLIENT) {
    throw new Error("PRIVATE_KEY или PRIVATE_KEY_CLIENT не найдены в файле .env");
}

// viem ожидает, что приватный ключ будет в формате 0x...
// Добавляем '0x' к ключам из .env, если префикс отсутствует, чтобы гарантировать правильный формат.
const ownerKey = (process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`) as Address;
const clientKey = (process.env.PRIVATE_KEY_CLIENT.startsWith('0x') ? process.env.PRIVATE_KEY_CLIENT : `0x${process.env.PRIVATE_KEY_CLIENT}`) as Address;

// Создаем аккаунт из приватного ключа
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
    amount: bigint // Количество токенов для блокировки
) {

    try {
        console.log(`[${walletClient.chain.name}] Шаг 1: Отправка транзакции approve от клиента ${walletClient.account.address}...`);
        const approveHash = await walletClient.writeContract({
            abi: IERC20Json.abi as Abi,
            address: tokenFrom,
            functionName: "approve",
            args: [bridgeFrom, amount]
        });
        console.log(`Транзакция approve успешно отправлена! Хэш: ${approveHash}`);
    }
    catch (error) {
        console.error("Ошибка при отправке транзакции approve:", error);
        throw new Error(`Ошибка при отправке транзакции approve: ${error}`);
    }

    try {
        console.log(`[${walletClient.chain.name}] Шаг 2: Отправка транзакции lock от клиента ${walletClient.account.address}...`);
        const lockHash = await walletClient.writeContract({
            abi: BridgeJson.abi as Abi,
            address: bridgeFrom,
            functionName: "lock",
            args: [amount]
        });
        console.log(`Транзакция lock успешно отправлена! Хэш: ${lockHash}`);
        console.log(`Токены успешно заблокированы. Ожидайте их появления в целевой сети.`);
    }
    catch (error) {
        console.error("Ошибка при отправке транзакции lock:", error);
        throw new Error(`Ошибка при отправке транзакции lock: ${error}`);
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
    walletOwnerTo: ReturnType<typeof createWalletClient> // Кошелек владельца для вызова unlock
) {
    console.log(`Запущен для сети ${publicClientFrom.chain.name}. Ожидание событий BridgeLock на адресе ${bridgeFrom}...`);
    
    publicClientFrom.watchContractEvent({
        abi: BridgeJson.abi as Abi,
        address: bridgeFrom,
        eventName: "BridgeLock",
        onLogs: async (logs) => {
            for (const log of logs) {
                // Проверяем, что аргументы существуют, прежде чем их использовать
                if (!log.args?.user || !log.args?.amount) {
                    console.error("Событие не содержит необходимых аргументов:", log);
                    continue;
                }

                const { user, amount: lockedAmount } = log.args;
                console.log(`Обнаружено событие BridgeLock в сети ${publicClientFrom.chain.name}: Пользователь ${user} заблокировал ${lockedAmount} токенов.`);

                try {
                    console.log(`Отправляем транзакцию unlock в сеть ${walletOwnerTo.chain.name}...`);
                    const hash = await walletOwnerTo.writeContract({
                        abi: BridgeJson.abi as Abi, // Используем полный ABI моста
                        address: bridgeTo,
                        functionName: "unlock",
                        args: [user, lockedAmount] // Используем сумму из события, а не общую
                    });
                    console.log(`Транзакция unlock успешно отправлена! Хэш: ${hash}`);
                }
                catch (error) {
                    console.error("Ошибка при отправке транзакции unlock:", error);
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
    await sendTokens(walletClientBSC, BRIDGE_BSC_ADDR, TOKEN_BSC_ADDR, parseEther("10"));
}

async function sendFromPolToBsc() {
    await sendTokens(walletClientPOL, BRIDGE_POL_ADDR, TOKEN_POL_ADDR, parseEther("10"));
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
    console.log("Скрипт запущен. Раскомментируйте нужную функцию для выполнения действия.");
    // --- Для пользователя  ---
    // await sendFromBscToPol();
    // await sendFromPolToBsc();

    // --- Для моста получателя ---
     await listenBscEvents();
    // await listenPolEvents();
}

main().catch(error => {
    console.error("Произошла критическая ошибка:", error);
    process.exit(1);
});