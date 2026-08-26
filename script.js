// TC計算ツール

const trainingPointValues = {
    3: 20,
    4: 40,
    5: 80,
    6: 150
};

const baseSecondsPerTier = 40000 / 2000;


// ---------- 共通 ----------

function calculateTrainingSeconds(speed, fromTier, toTier, count) {
    const multiplier = 1 + speed / 100;
    const tierDifference =
        fromTier === toTier ? fromTier : toTier - fromTier;

    return baseSecondsPerTier * tierDifference * count / multiplier;
}

function formatTrainingTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let text = "";

    if (days > 0) {
        text += `${days}日`;
    }

    if (hours > 0 || days > 0) {
        text += `${hours}時間`;
    }

    if (minutes > 0 || hours > 0 || days > 0) {
        text += `${minutes}分`;
    }

    text += `${secs}秒`;

    return text;
}

function spearMinutes(seconds) {
    return Math.ceil(seconds / 60);
}

function formatPoint(value) {
    return Math.floor(value).toLocaleString() + " Pt";
}

function formatPeople(value) {
    return Math.ceil(value).toLocaleString() + "人";
}


// ---------- 通常計算 ----------

function calculateNormal() {

    const speed =
        Number(document.getElementById("training-speed").value);

    const type =
        document.getElementById("training-type").value;

    const count =
        Number(document.getElementById("soldier-count").value);

    const [fromTier, toTier] =
        type.split("-").map(Number);


    const seconds =
        calculateTrainingSeconds(
            speed,
            fromTier,
            toTier,
            count
        );


    document.getElementById("training-time").textContent =
        formatTrainingTime(seconds);


    const minutes =
        spearMinutes(seconds);


    document.getElementById("spear-point-day1").textContent =
        formatPoint(minutes * 250);


    document.getElementById("spear-point-day6-7").textContent =
        formatPoint(minutes * 200);


    const pointPerSoldier =
        fromTier === toTier
            ? trainingPointValues[toTier]
            : trainingPointValues[toTier] -
              trainingPointValues[fromTier];


    document.getElementById("training-point").textContent =
        formatPoint(count * pointPerSoldier);
}


// ---------- 逆算入力 ----------

const targetPointInput =
    document.getElementById("target-point");


targetPointInput.addEventListener("input", function () {

    const raw =
        this.value.replace(/[^0-9]/g, "");

    this.value =
        raw
            ? Number(raw).toLocaleString()
            : "";
});


function getTargetPoint() {

    return Number(
        targetPointInput.value.replace(/,/g, "")
    );
}


function updateDayDescription() {

    const day =
        document.getElementById("tc-day").value;

    const box =
        document.getElementById("tc-day-description");


    if (day === "1") {

        box.innerHTML =
            "1日目：スピードアップのテーマ（1分につき250Pt獲得）";

    } else if (day === "3") {

        box.innerHTML =
            "3日目：訓練のテーマ（育成兵士のTier × 人数でPt獲得）";

    } else {

        box.innerHTML =
            "6～7日目：オールスターのテーマ（1分につき200Pt獲得）";
    }


    updateInventoryInputs();
}


// ---------- 3日目の所持数欄 ----------

function updateInventoryInputs() {

    const day =
        document.getElementById("tc-day").value;

    const section =
        document.getElementById("soldier-inventory-section");

    const container =
        document.getElementById("inventory-inputs");


    if (day !== "3") {

        section.classList.add("hidden");

        container.innerHTML = "";

        return;
    }


    section.classList.remove("hidden");


    const unlocked =
        Number(
            document.getElementById("unlocked-tier").value
        );


    container.innerHTML = "";


    /*
        T6解放 → T5・T4・T3
        T5解放 → T4・T3
        T4解放 → T3
    */

    for (
        let tier = unlocked - 1;
        tier >= 3;
        tier--
    ) {

        const row =
            document.createElement("div");

        row.className =
            "inventory-row";


        const label =
            document.createElement("label");

        label.textContent =
            `T${tier}`;


        const input =
            document.createElement("input");

        input.type =
            "number";

        input.min =
            "0";

        input.value =
            "0";

        input.id =
            `inventory-t${tier}`;


        row.appendChild(label);

        row.appendChild(input);

        container.appendChild(row);
    }
}


// ---------- 1日目 ----------

function calculateDay1(target, speed, tier) {

    const maxCount =
        66000;


    const fullSeconds =
        calculateTrainingSeconds(
            speed,
            tier,
            tier,
            maxCount
        );


    /*
        3日目のために
        騎兵・射撃・歩兵
        各2日分
        合計6日分を温存
    */

    const reserveSeconds =
        6 * 86400;


    const usableSeconds =
        Math.max(
            0,
            fullSeconds - reserveSeconds
        );


    const maxPoint =
        spearMinutes(usableSeconds) * 250;


    /*
        66,000人以内で
        目標達成できる場合
    */

    if (target <= maxPoint) {

        const requiredUsableMinutes =
            Math.ceil(target / 250);


        const requiredTotalSeconds =
            requiredUsableMinutes * 60 +
            reserveSeconds;


        const secondsPerSoldier =
            fullSeconds / maxCount;


        const count =
            Math.min(
                maxCount,
                Math.ceil(
                    requiredTotalSeconds /
                    secondsPerSoldier
                )
            );


        const actualFullSeconds =
            calculateTrainingSeconds(
                speed,
                tier,
                tier,
                count
            );


        const actualUsableSeconds =
            Math.max(
                0,
                actualFullSeconds -
                reserveSeconds
            );


        const actualPoint =
            spearMinutes(actualUsableSeconds) *
            250;


        return {

            withinLimit: true,

            tier,

            count,

            fullSeconds:
                actualFullSeconds,

            usableSeconds:
                actualUsableSeconds,

            point:
                actualPoint,

            remaining:
                0,

            lower:
                null
        };
    }


    /*
        66,000人すべて育成しても
        足りない場合
    */

    const remaining =
        target - maxPoint;


    const lowerTier =
        tier - 1;


    let lower =
        null;


    if (lowerTier >= 3) {

        const secondsPerSoldier =
            calculateTrainingSeconds(
                speed,
                lowerTier,
                lowerTier,
                1
            );


        const requiredMinutes =
            Math.ceil(
                remaining / 250
            );


        const count =
            Math.ceil(
                (requiredMinutes * 60) /
                secondsPerSoldier
            );


        const seconds =
            calculateTrainingSeconds(
                speed,
                lowerTier,
                lowerTier,
                count
            );


        lower = {

            tier:
                lowerTier,

            count,

            seconds,

            point:
                spearMinutes(seconds) * 250
        };
    }


    return {

        withinLimit:
            false,

        tier,

        count:
            maxCount,

        fullSeconds,

        usableSeconds,

        point:
            maxPoint,

        remaining,

        lower
    };
}


// ---------- 6～7日目 ----------

function calculateDay67(target, speed, tier) {

    const minutes =
        Math.ceil(
            target / 200
        );


    const requiredSeconds =
        minutes * 60;


    const secondsPerSoldier =
        calculateTrainingSeconds(
            speed,
            tier,
            tier,
            1
        );


    const count =
        Math.ceil(
            requiredSeconds /
            secondsPerSoldier
        );


    const seconds =
        calculateTrainingSeconds(
            speed,
            tier,
            tier,
            count
        );


    return {

        tier,

        count,

        seconds,

        point:
            spearMinutes(seconds) * 200
    };
}


// ---------- 3日目 ----------

function getInventory(tier) {

    const input =
        document.getElementById(
            `inventory-t${tier}`
        );


    return input
        ? Number(input.value)
        : 0;
}


function calculateDay3(target, speed, unlocked) {

    let upgradePoint = 0;
    let upgradeSeconds = 0;

    const upgrades = [];


    /*
        所持している低Tier兵士だけを
        アップグレード対象にする
    */

    for (
        let tier = unlocked - 1;
        tier >= 3;
        tier--
    ) {

        const count =
            getInventory(tier);


        // 0人なら対象外
        if (count <= 0) {
            continue;
        }


        // 1人あたりの獲得ポイント
        const perSoldier =
            trainingPointValues[unlocked] -
            trainingPointValues[tier];


        // 獲得ポイント
        const point =
            count * perSoldier;


        // アップグレードに必要な訓練時間
        const seconds =
            calculateTrainingSeconds(
                speed,
                tier,
                unlocked,
                count
            );


        upgradePoint += point;
        upgradeSeconds += seconds;


        upgrades.push({

            from:
                tier,

            to:
                unlocked,

            count,

            point,

            seconds
        });
    }


    const remaining =
        Math.max(
            0,
            target - upgradePoint
        );


    let training =
        null;


    /*
        アップグレードだけで
        ポイントが足りない場合
    */

    if (remaining > 0) {

        const perSoldier =
            trainingPointValues[unlocked];


        const count =
            Math.ceil(
                remaining /
                perSoldier
            );


        const point =
            count *
            perSoldier;


        // 新規育成に必要な訓練時間
        const seconds =
            calculateTrainingSeconds(
                speed,
                unlocked,
                unlocked,
                count
            );


        training = {

            tier:
                unlocked,

            count,

            point,

            seconds
        };
    }


    // 必要訓練時間の合計
    const totalSeconds =
        upgradeSeconds +
        (
            training
                ? training.seconds
                : 0
        );


    return {

        upgrades,

        upgradePoint,

        upgradeSeconds,

        remaining,

        training,

        totalSeconds
    };
}


// ---------- 結果表示 ----------

function step(number, text, note = "") {

    return `

        <div class="action-step">

            <div class="step-number">
                ${number}
            </div>

            <div class="step-text">
                ${text}
            </div>

        </div>

        ${
            note
                ? `
                    <div class="action-note">
                        ${note}
                    </div>
                  `
                : ""
        }

    `;
}


function showResult(
    action,
    points,
    details,
    conditions
) {

    document.getElementById(
        "action-content"
    ).innerHTML =
        action;


    document.getElementById(
        "point-content"
    ).innerHTML =
        points;


    document.getElementById(
        "detail-content"
    ).innerHTML =
        details;


    document.getElementById(
        "condition-content"
    ).innerHTML =
        conditions;


    document.getElementById(
        "reverse-result"
    ).classList.remove("hidden");
}


// ---------- 逆算本体 ----------

function calculateReverse() {

    const target =
        getTargetPoint();


    const day =
        document.getElementById(
            "tc-day"
        ).value;


    const speed =
        Number(
            document.getElementById(
                "reverse-training-speed"
            ).value
        );


    const tier =
        Number(
            document.getElementById(
                "unlocked-tier"
            ).value
        );


    if (!target || target <= 0) {

        alert(
            "欲しいポイント数を入力してください。"
        );

        return;
    }


    // =========================
    // 1日目
    // =========================

    if (day === "1") {

        const r =
            calculateDay1(
                target,
                speed,
                tier
            );


        let action =
            "";


        let details =
            "";


        if (r.withinLimit) {

            action =

                step(
                    1,
                    `T${r.tier}を${formatPeople(r.count)}育成する。`
                )

                +

                `
                <div class="action-note">
                    3日目のために、騎兵・射撃・歩兵の各2日分（計6日）のスピードアップを残して計算しています。
                </div>
                `;

        } else {

            if (r.lower) {

                action =

                    step(
                        1,
                        `T${r.lower.tier}を${formatPeople(r.lower.count)}育成する。`
                    )

                    +

                    step(
                        2,
                        `騎兵・射撃・歩兵をそれぞれ22,000人ずつT${r.tier}の訓練を開始し、それぞれ残り2日で訓練終了となるように、スピードアップを使用してください。`,
                        "※3日目でポイントを得るためにスピードアップを温存します。"
                    );

            } else {

                action =

                    step(
                        1,
                        `T${r.tier}を${formatPeople(r.count)}育成する。`
                    );
            }
        }


        details = `

            <div class="detail-row">
                <span>T${r.tier}育成</span>
                <strong>
                    ${formatPeople(r.count)}
                </strong>
            </div>

            <div class="detail-row">
                <span>総訓練時間</span>
                <strong>
                    ${formatTrainingTime(r.fullSeconds)}
                </strong>
            </div>

            <div class="detail-row">
                <span>使用するスピードアップ</span>
                <strong>
                    ${formatTrainingTime(r.usableSeconds)}
                </strong>
            </div>

            <div class="detail-row">
                <span>T${r.tier}で獲得</span>
                <strong>
                    ${formatPoint(r.point)}
                </strong>
            </div>

            <div class="detail-row">
                <span>残り必要ポイント</span>
                <strong>
                    ${formatPoint(r.remaining)}
                </strong>
            </div>

            ${
                r.lower
                    ? `

                        <div class="detail-row">
                            <span>
                                T${r.lower.tier}育成
                            </span>

                            <strong>
                                ${formatPeople(r.lower.count)}
                            </strong>
                        </div>

                        <div class="detail-row">
                            <span>
                                T${r.lower.tier}訓練時間
                            </span>

                            <strong>
                                ${formatTrainingTime(
                                    r.lower.seconds
                                )}
                            </strong>
                        </div>

                        <div class="detail-row">
                            <span>
                                T${r.lower.tier}で獲得
                            </span>

                            <strong>
                                ${formatPoint(
                                    r.lower.point
                                )}
                            </strong>
                        </div>

                      `
                    : ""
            }

        `;


        const actualPoint =
            r.point +
            (
                r.lower
                    ? r.lower.point
                    : 0
            );


        showResult(

            action,

            `
                <div class="point-value">
                    ${formatPoint(actualPoint)}
                </div>
            `,

            details,

            `
                <ul class="condition-list">

                    <li>
                        訓練速度：${speed}%
                    </li>

                    <li>
                        T${tier}は最大66,000人まで計算
                    </li>

                    <li>
                        1日目：1分につき250Pt
                    </li>

                    <li>
                        3日目のために6日分のスピードアップを温存
                    </li>

                </ul>
            `
        );


        return;
    }


    // =========================
    // 6～7日目
    // =========================

    if (day === "6-7") {

        const r =
            calculateDay67(
                target,
                speed,
                tier
            );


        showResult(

            step(
                1,
                `T${r.tier}を${formatPeople(r.count)}育成する。`
            ),

            `
                <div class="point-value">
                    ${formatPoint(r.point)}
                </div>
            `,

            `

                <div class="detail-row">
                    <span>育成Tier</span>

                    <strong>
                        T${r.tier}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>必要育成人数</span>

                    <strong>
                        ${formatPeople(r.count)}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>訓練時間</span>

                    <strong>
                        ${formatTrainingTime(r.seconds)}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>獲得スピアポイント</span>

                    <strong>
                        ${formatPoint(r.point)}
                    </strong>
                </div>


                <div class="result-message">
                    6～7日目は1分につき200Ptとして計算しています。
                </div>

            `,

            `

                <ul class="condition-list">

                    <li>
                        訓練速度：${speed}%
                    </li>

                    <li>
                        育成Tier：T${tier}
                    </li>

                    <li>
                        1分につき200Pt
                    </li>

                </ul>

            `
        );


        return;
    }


    // =========================
    // 3日目
    // =========================

    if (day === "3") {

        const r =
            calculateDay3(
                target,
                speed,
                tier
            );


        let action =
            "";


        let number =
            1;


        /*
            アップグレード対象がある場合だけ
            「アップグレードしてください」
            を表示
        */

        if (r.upgrades.length > 0) {

            action +=

                step(
                    number++,
                    `現在の兵士をT${tier}までアップグレードする。`
                );
        }


        /*
            不足ポイントがある場合だけ
            育成ステップを表示
        */

        if (r.training) {

            action +=

                step(
                    number,
                    `T${r.training.tier}を${formatPeople(r.training.count)}育成する。`
                );
        }


        /*
            アップグレードだけで
            目標達成できた場合
        */

        if (!action) {

            action =

                `
                <div class="result-message">
                    現在の兵士のアップグレードだけで、目標ポイントを獲得できます。
                </div>
                `;
        }


        let details =
            "";


        r.upgrades.forEach(
            item => {

                details += `

                    <div class="detail-row">

                        <span>
                            T${item.from}
                            →
                            T${item.to}
                            アップグレード
                        </span>

                        <strong>
                            ${formatPeople(item.count)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>
                            訓練時間
                        </span>

                        <strong>
                            ${formatTrainingTime(item.seconds)}
                        </strong>

                    </div>


                    <div class="detail-row">

                        <span>
                            獲得ポイント
                        </span>

                        <strong>
                            ${formatPoint(item.point)}
                        </strong>

                    </div>

                `;
            }
        );


        details += `

            <div class="detail-row">

                <span>
                    アップグレード合計
                </span>

                <strong>
                    ${formatPoint(
                        r.upgradePoint
                    )}
                </strong>

            </div>


            <div class="detail-row">

                <span>
                    残り必要ポイント
                </span>

                <strong>
                    ${formatPoint(
                        r.remaining
                    )}
                </strong>

            </div>

        `;


        if (r.training) {

            details += `

                <div class="detail-row">

                    <span>
                        追加育成Tier
                    </span>

                    <strong>
                        T${r.training.tier}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>
                        追加育成人数
                    </span>

                    <strong>
                        ${formatPeople(
                            r.training.count
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>
                        訓練時間
                    </span>

                    <strong>
                        ${formatTrainingTime(
                            r.training.seconds
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>
                        追加育成ポイント
                    </span>

                    <strong>
                        ${formatPoint(
                            r.training.point
                        )}
                    </strong>

                </div>

            `;
        }


        /*
        details += `

            <div class="detail-row">

                <span>
                    必要訓練時間合計
                </span>

                <strong>
                    ${formatTrainingTime(
                        r.totalSeconds
                    )}
                </strong>

            </div>

        `;
        */


        const actualPoint =
            r.upgradePoint +
            (
                r.training
                    ? r.training.point
                    : 0
            );


        showResult(

            action,

            `
                <div class="point-value">
                    ${formatPoint(actualPoint)}
                </div>
            `,

            details,

            `

                <ul class="condition-list">

                    <li>
                        解放Tier：T${tier}
                    </li>

                    <li>
                        低Tier兵士を解放Tierまでアップグレード
                    </li>

                    <li>
                        不足分はT${tier}育成で補完
                    </li>

                    <li>
                        訓練ポイント：
                        T3=20 / T4=40 / T5=80 / T6=150
                    </li>

                </ul>

            `
        );
    }
}


// ---------- モード切替 ----------

document
    .getElementById("normal-mode-button")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("normal-section")
                .classList
                .remove("hidden");


            document
                .getElementById("reverse-section")
                .classList
                .add("hidden");


            document
                .getElementById("normal-mode-button")
                .classList
                .add("active");


            document
                .getElementById("reverse-mode-button")
                .classList
                .remove("active");
        }
    );


document
    .getElementById("reverse-mode-button")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("normal-section")
                .classList
                .add("hidden");


            document
                .getElementById("reverse-section")
                .classList
                .remove("hidden");


            document
                .getElementById("normal-mode-button")
                .classList
                .remove("active");


            document
                .getElementById("reverse-mode-button")
                .classList
                .add("active");


            updateDayDescription();
        }
    );


document
    .getElementById("calculate-button")
    .addEventListener(
        "click",
        calculateNormal
    );


document
    .getElementById("tc-day")
    .addEventListener(
        "change",
        updateDayDescription
    );


document
    .getElementById("unlocked-tier")
    .addEventListener(
        "change",
        updateInventoryInputs
    );


document
    .getElementById("reverse-calculate-button")
    .addEventListener(
        "click",
        calculateReverse
    );


updateDayDescription();