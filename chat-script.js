const drugDatabase = [
    {
        name: "カロナール錠200mg・300mg・500mg",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナール錠", "アセトアミノフェン", "200", "300", "500", "200mg", "300mg", "500mg"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/172190_1141007F1063_5_06"
    },
    {
        name: "カロナール細粒20%・50%",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナール細粒", "アセトアミノフェン"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/172190_1141007C1075_5_05"
    },
    {
        name: "ロキソニン錠60mg・細粒10%",
        genericName: "ロキソプロフェンナトリウム水和物",
        searchKeywords: ["ロキソニン", "ロキソニン錠", "ロキソニン細粒", "ロキソプロフェン", "60", "10", "60mg", "10%"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/430574_1149019C1149_1_13"
    },
    {
        name: "ロキソニンゲル1％",
        genericName: "ロキソプロフェンナトリウム水和物",
        searchKeywords: ["ロキソニン", "ロキソニンゲル", "ロキソプロフェン", "ゲル", "外用薬"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/430574_2649735Q1020_1_15"
    },
    {
        name: "カロナールシロップ2％",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナールシロップ", "アセトアミノフェン", "シロップ"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/172190_1141007Q1048_5_04"
    },
    {
        name: "カロナール坐剤小児用50",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナール坐剤", "アセトアミノフェン", "坐剤", "小児用"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/172190_1141700J1088_4_04"
    },
    {
        name: "カロナール坐剤100・200・400",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナール坐剤", "アセトアミノフェン", "坐剤"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/172190_1141700J2050_A_05"
    },
    {
        name: "セレコックス錠100mg・200mg",
        genericName: "セレコキシブ",
        searchKeywords: ["セレコックス", "セレコックス錠", "セレコキシブ", "100", "200", "100mg", "200mg"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/671450_1149037F1020_2_04"
    },
    {
        name: "ムコダイン錠250mg・500mg",
        genericName: "L-カルボシステイン",
        searchKeywords: ["ムコダイン", "ムコダイン錠", "カルボシステイン", "250", "500", "250mg", "500mg"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/231099_2233002F1174_2_02"
    },
    {
        name: "ムコダインシロップ5%",
        genericName: "L-カルボシステイン",
        searchKeywords: ["ムコダイン", "ムコダインシロップ", "カルボシステイン", "シロップ"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/231099_2233002Q1035_2_02"
    },
    {
        name: "ムコダインDS50%",
        genericName: "L-カルボシステイン",
        searchKeywords: ["ムコダイン", "ムコダインDS", "カルボシステイン", "ドライシロップ"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/231099_2233002R2029_2_02"
    }
];

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    setTimeout(() => {
        searchAndReply(message);
    }, 500);
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    messageDiv.innerHTML = `
        <div>
            <div class="message-bubble">${escapeHtml(message)}</div>
            <div class="message-time">あなた</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessage(content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    messageDiv.innerHTML = `
        <div>
            <div class="message-bubble">${content}</div>
            <div class="message-time">AI アシスタント</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function searchAndReply(searchTerm) {
    // 検索語をスペースで分割して複数キーワードに対応
    const searchWords = searchTerm.trim().split(/\s+/).map(word => word.toLowerCase());
    
    const results = drugDatabase.filter(drug => {
        // 薬品名と一般名も検索対象に含める
        const searchableText = [
            drug.name.toLowerCase(),
            drug.genericName.toLowerCase(),
            ...drug.searchKeywords.map(keyword => keyword.toLowerCase())
        ];
        
        // 薬品名から数値を自動抽出して検索対象に追加
        const extractedNumbers = drug.name.match(/\d+/g) || [];
        searchableText.push(...extractedNumbers);
        
        // すべての検索語が含まれているかチェック（AND検索）
        return searchWords.every(searchWord => 
            searchableText.some(text => text.includes(searchWord))
        );
    });
    
    if (results.length === 0) {
        addBotMessage(`「${escapeHtml(searchTerm)}」に関連する医薬品が見つかりませんでした。<br><br>別のキーワードで検索してみてください。<br>例：「ロキソニン」「カロナール 錠」「ムコダイン 500」`);
        return;
    }
    
    let responseContent = `「${escapeHtml(searchTerm)}」の検索結果：${results.length}件見つかりました。<br><br>以下から選択してください：`;
    
    responseContent += '<div class="drug-options">';
    results.forEach(drug => {
        responseContent += `
            <div class="drug-item" onclick="openDocument('${drug.url}')">
                <div class="drug-name">${escapeHtml(drug.name)}</div>
                <div class="drug-generic">一般名：${escapeHtml(drug.genericName)}</div>
            </div>
        `;
    });
    responseContent += '</div>';
    
    addBotMessage(responseContent);
}

function openDocument(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => {
        addBotMessage('添付文書を開きました。他にも薬品を検索しますか？');
    }, 1000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('chat-input').addEventListener('input', function() {
    const sendButton = document.getElementById('send-button');
    sendButton.disabled = this.value.trim() === '';
});

window.addEventListener('load', function() {
    document.getElementById('chat-input').focus();
});