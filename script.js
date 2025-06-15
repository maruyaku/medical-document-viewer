const drugDatabase = [
    {
        name: "カロナール錠200mg・300mg・500mg",
        genericName: "アセトアミノフェン",
        searchKeywords: ["カロナール", "カロナール錠", "アセトアミノフェン"],
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
        searchKeywords: ["ロキソニン", "ロキソニン錠", "ロキソニン細粒", "ロキソプロフェン"],
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
        searchKeywords: ["セレコックス", "セレコックス錠", "セレコキシブ"],
        url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/671450_1149037F1020_2_04"
    },
    {
        name: "ムコダイン錠250mg・500mg",
        genericName: "L-カルボシステイン",
        searchKeywords: ["ムコダイン", "ムコダイン錠", "カルボシステイン"],
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

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.trim();
    if (!searchTerm) {
        alert('検索キーワードを入力してください');
        return;
    }

    const results = drugDatabase.filter(drug => 
        drug.searchKeywords.some(keyword => 
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    displaySearchResults(results, searchTerm);
}

function displaySearchResults(results, searchTerm) {
    const inputSection = document.getElementById('search-input-section');
    const resultsSection = document.getElementById('search-results-section');
    const resultsTitle = document.getElementById('search-results-title');
    const resultsContainer = document.getElementById('search-results');

    inputSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    resultsTitle.textContent = `「${searchTerm}」の検索結果 (${results.length}件)`;

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">該当する薬品が見つかりませんでした。</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(drug => `
        <div class="drug-item">
            <h3>${drug.name}</h3>
            <p>一般名：${drug.genericName}</p>
            <button class="view-btn" onclick="viewDocument('${drug.url}')">
                添付文書を表示
            </button>
        </div>
    `).join('');
}

function goBack() {
    const inputSection = document.getElementById('search-input-section');
    const resultsSection = document.getElementById('search-results-section');
    
    inputSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    document.getElementById('search-input').value = '';
}

function viewDocument(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

let recognition = null;
let isListening = false;

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ja-JP';
        
        recognition.onstart = function() {
            isListening = true;
            updateVoiceButton();
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('search-input').value = transcript;
        };
        
        recognition.onend = function() {
            isListening = false;
            updateVoiceButton();
        };
        
        recognition.onerror = function(event) {
            console.error('音声認識エラー:', event.error);
            isListening = false;
            updateVoiceButton();
            
            if (event.error === 'not-allowed') {
                alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
            } else if (event.error === 'no-speech') {
                alert('音声が検出されませんでした。もう一度お試しください。');
            } else {
                alert('音声認識でエラーが発生しました: ' + event.error);
            }
        };
    } else {
        console.error('このブラウザは音声認識をサポートしていません');
        document.getElementById('voice-btn').style.display = 'none';
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('このブラウザは音声認識をサポートしていません');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function updateVoiceButton() {
    const voiceBtn = document.getElementById('voice-btn');
    if (isListening) {
        voiceBtn.textContent = '🛑';
        voiceBtn.style.background = '#ff4444';
    } else {
        voiceBtn.textContent = '🎤';
        voiceBtn.style.background = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initSpeechRecognition();
});