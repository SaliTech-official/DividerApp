const LABELS = [
    { value: 0.51, label: '0.51' },
    { value: 0.99, label: '0.99' },
    { value: 4.99, label: '4.99' },
    { value: 9.99, label: '9.99' },
    { value: 24.99, label: '24.99' },
];

const labelsSection = document.getElementById('labels-section');

LABELS.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'label-card';
    div.innerHTML = `
        <div class="label-row">
            <span class="label-value">${item.label}</span>
            <input type="number" min="0" step="1" id="count-${idx}" class="label-input" style="margin-right: 10px;" placeholder="حداکثر تعداد" />
            <input type="number" min="0" step="1" id="min-count-${idx}" class="label-input" placeholder="حداقل تعداد" />
        </div>
        <div class="checkbox-row">
            <label class="checkbox-label">
                <input type="checkbox" id="unlimited-${idx}" class="checkbox-input">
                <span class="checkbox-custom unlimited"></span>
                <span class="checkbox-text unlimited">نامحدود</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" id="exclude-${idx}" class="checkbox-input">
                <span class="checkbox-custom exclude"></span>
                <span class="checkbox-text exclude">اصلا استفاده نشود</span>
            </label>
        </div>
    `;
    labelsSection.appendChild(div);

    // Checkbox logic
    const unlimitedCheckbox = div.querySelector(`#unlimited-${idx}`);
    const numberInput = div.querySelector(`#count-${idx}`);
    const excludeCheckbox = div.querySelector(`#exclude-${idx}`);

    unlimitedCheckbox.addEventListener('change', () => {
        if (!excludeCheckbox.checked) {
            numberInput.disabled = unlimitedCheckbox.checked;
            if (unlimitedCheckbox.checked) numberInput.value = '';
        }
    });
    excludeCheckbox.addEventListener('change', () => {
        if (excludeCheckbox.checked) {
            numberInput.disabled = true;
            unlimitedCheckbox.disabled = true;
            numberInput.value = '';
            unlimitedCheckbox.checked = false;
        } else {
            numberInput.disabled = unlimitedCheckbox.checked;
            unlimitedCheckbox.disabled = false;
        }
    });
});

function calculateOptimalGrouping(total, options) {
    // options: [{value, unlimited, count, minCount, index}]
    // Sort descending by value for greedy
    options = options.slice().sort((a, b) => b.value - a.value);
    let best = null;

    // Helper: recursive search
    function search(idx, current, used, rem) {
        if (idx === options.length) {
            // At the end, check if this is better
            const usedCount = used.reduce((a, b) => a + b, 0);
            if (
                best === null ||
                rem < best.rem ||
                (rem === best.rem && usedCount < best.usedCount)
            ) {
                best = { used: used.slice(), rem, usedCount };
            }
            return;
        }
        const opt = options[idx];
        let maxUse = opt.unlimited ? Math.floor(current / opt.value) : Math.min(opt.count, Math.floor(current / opt.value));
        let minUse = opt.minCount || 0; // حداقل تعداد استفاده‌شده
        for (let cnt = maxUse; cnt >= minUse; cnt--) { // فقط ترکیب‌هایی که حداقل و حداکثر تعداد را رعایت می‌کنند
            search(
                idx + 1,
                +(current - cnt * opt.value).toFixed(6),
                used.concat(cnt),
                +(current - cnt * opt.value).toFixed(6)
            );
        }
    }
    search(0, total, [], total);
    return best;
}

document.getElementById('calculate-btn').addEventListener('click', () => {
    const mainInput = parseFloat(document.getElementById('main-input').value);
    if (isNaN(mainInput) || mainInput <= 0) {
        document.getElementById('result').innerHTML = '<span class="text-red-600">عدد ورودی معتبر نیست.</span>';
        return;
    }
    const options = LABELS.map((item, idx) => {
        const unlimited = document.getElementById(`unlimited-${idx}`).checked;
        const countInput = document.getElementById(`count-${idx}`).value;
        const count = parseInt(countInput);
        const minCountInput = document.getElementById(`min-count-${idx}`).value;
        const minCount = parseInt(minCountInput);
        const exclude = document.getElementById(`exclude-${idx}`).checked;
        return {
            value: item.value,
            unlimited: unlimited && (!countInput || isNaN(count)),
            count: (!countInput || isNaN(count)) ? Infinity : count,
            minCount: (!minCountInput || isNaN(minCount)) ? 0 : minCount,
            exclude,
            index: idx
        };
    }).filter(opt => !opt.exclude);
    const result = calculateOptimalGrouping(mainInput, options);
    if (!result) {
        document.getElementById('result').innerHTML = '<span class="text-red-600">امکان دسته‌بندی وجود ندارد.</span>';
        return;
    }
    // نتیجه را برعکس کن تا با ترتیب LABELS یکی شود
    const usedReversed = result.used.slice().reverse();
    let usedByOriginalIndex = Array(LABELS.length).fill(0);
    let usedIdx = 0;
    LABELS.forEach((item, idx) => {
        const exclude = document.getElementById(`exclude-${idx}`).checked;
        if (exclude) {
            usedByOriginalIndex[idx] = 0;
        } else {
            usedByOriginalIndex[idx] = usedReversed[usedIdx];
            usedIdx++;
        }
    });
    let html = '<div class="mb-2 font-semibold">نتیجه:</div>';
    LABELS.forEach((item, idx) => {
        const exclude = document.getElementById(`exclude-${idx}`).checked;
        if (exclude) {
            html += `<div>${item.label}: <span class="font-bold text-gray-400">استفاده نشد</span></div>`;
        } else {
            html += `<div>${item.label}: <span class="font-bold">${usedByOriginalIndex[idx]}</span></div>`;
        }
    });
    html += `<div class="mt-2">باقیمانده: <span class="font-bold">${result.rem.toFixed(2)}</span></div>`;
    document.getElementById('result').innerHTML = html;
});

document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('main-input').value = '';
    LABELS.forEach((item, idx) => {
        document.getElementById(`count-${idx}`).value = '';
        document.getElementById(`min-count-${idx}`).value = '';
        document.getElementById(`unlimited-${idx}`).checked = false;
        document.getElementById(`unlimited-${idx}`).disabled = false;
        document.getElementById(`exclude-${idx}`).checked = false;
        document.getElementById(`count-${idx}`).disabled = false;
    });
    document.getElementById('result').innerHTML = '';
});