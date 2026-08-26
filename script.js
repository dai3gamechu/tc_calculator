// TC計算ツール


// ========================================
// 訓練ポイントの基準値
// ========================================

const trainingPointValues = {
    3: 20,
    4: 40,
    5: 80,
    6: 150
};


// ========================================
// 訓練時間・スピアポイント・訓練ポイントを計算
// ========================================

function calculateTrainingTime() {

    // ----------------------------------------
    // 入力値を取得
    // ----------------------------------------

    const trainingSpeed =
        Number(document.getElementById("training-speed").value);

    const trainingType =
        document.getElementById("training-type").value;

    const soldierCount =
        Number(document.getElementById("soldier-count").value);


    // ----------------------------------------
    // 訓練速度を倍率に変換
    // 82.8% → 1.828
    // ----------------------------------------

    const speedMultiplier =
        1 + (trainingSpeed / 100);


    // ----------------------------------------
    // 1Tierあたりの基準時間
    // 2,000人あたり40,000秒
    // ----------------------------------------

    const baseSecondsPerTier =
        40_000 / 2_000;


    // ----------------------------------------
    // 訓練するTierを取得
    // ----------------------------------------

    const [fromTier, toTier] =
        trainingType.split("-").map(Number);


    // ----------------------------------------
    // 必要なTier数を計算
    // ----------------------------------------

    let tierDifference;

    if (fromTier === toTier) {

        // 通常訓練
        tierDifference = fromTier;

    } else {

        // アップグレード
        tierDifference = toTier - fromTier;
    }


    // ----------------------------------------
    // 基準訓練時間
    // ----------------------------------------

    const baseTrainingSeconds =
        baseSecondsPerTier *
        tierDifference *
        soldierCount;


    // ----------------------------------------
    // 訓練速度を反映
    // ----------------------------------------

    const trainingSeconds =
        baseTrainingSeconds / speedMultiplier;


    // ========================================
    // 訓練時間を表示用に変換
    // ========================================

    const days =
        Math.floor(trainingSeconds / 86400);

    const hours =
        Math.floor((trainingSeconds % 86400) / 3600);

    const minutes =
        Math.floor((trainingSeconds % 3600) / 60);

    const seconds =
        Math.floor(trainingSeconds % 60);


    // ----------------------------------------
    // 「0日」「0時間」などを省略して表示
    // ----------------------------------------

    let trainingTimeText = "";

    if (days > 0) {
        trainingTimeText += `${days}日`;
    }

    if (hours > 0 || days > 0) {
        trainingTimeText += `${hours}時間`;
    }

    if (minutes > 0 || hours > 0 || days > 0) {
        trainingTimeText += `${minutes}分`;
    }

    trainingTimeText += `${seconds}秒`;


    // ----------------------------------------
    // 訓練時間を表示
    // ----------------------------------------

    document.getElementById("training-time").textContent =
        trainingTimeText;


    // ========================================
    // 訓練ポイントを計算
    // ========================================

    let trainingPointPerSoldier;

    if (fromTier === toTier) {

        // 通常訓練
        trainingPointPerSoldier =
            trainingPointValues[toTier];

    } else {

        // アップグレード
        trainingPointPerSoldier =
            trainingPointValues[toTier] -
            trainingPointValues[fromTier];
    }


    // 育成人数 × 1人あたりのポイント
    const trainingPoint =
        soldierCount * trainingPointPerSoldier;


    // ----------------------------------------
    // 訓練ポイントを表示
    // ----------------------------------------

    document.getElementById("training-point").textContent =
        trainingPoint.toLocaleString() + " Pt";


    // ========================================
    // スピアポイントを計算
    // ========================================

    // 訓練時間を「分」に変換
    // 秒が1秒でもあれば切り上げる
    //
    // 59分23秒 → 60分
    // 60分01秒 → 61分

    const spearMinutes =
        Math.ceil(trainingSeconds / 60);


    // ----------------------------------------
    // TC初日
    // 1分あたり250ポイント
    // ----------------------------------------

    const spearPointDay1 =
        spearMinutes * 250;


    // ----------------------------------------
    // TC6～7日目
    // 1分あたり200ポイント
    // ----------------------------------------

    const spearPointDay6_7 =
        spearMinutes * 200;


    // ----------------------------------------
    // スピアポイントを表示
    // ----------------------------------------

    document.getElementById("spear-point-day1").textContent =
        spearPointDay1.toLocaleString() + " Pt";

    document.getElementById("spear-point-day6-7").textContent =
        spearPointDay6_7.toLocaleString() + " Pt";
}


// ========================================
// 「計算する」ボタンが押されたら計算
// ========================================

document
    .getElementById("calculate-button")
    .addEventListener("click", calculateTrainingTime);