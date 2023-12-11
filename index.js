// Выбор DOM-элементов
const goButton = document.querySelector('.submit');
const operationType = document.querySelector('.operationType');
const fileElement = document.querySelector('.compressed-window');
const keyInputWindow = document.querySelector('.key-window');

// Обработчики событий для кнопок

goButton.addEventListener('click', function () {
	if (operationType.value === 'compress') {
		handleFileSelection(fileElement);
	} else if (operationType.value === 'decompress') {
		handleFilesSelection(fileElement, keyInputWindow);
	} else {
		alert('Что-то пошло не так');
	}
});

// Обработчик изменения файла
function handleFileSelection(input) {
	if (!input.files[0]) {
		alert('Выберите файл!');
		return;
	}

	const reader = new FileReader();
	const file = input.files[0];

	reader.readAsText(file);

	reader.onload = () => {
		const [key, textContent] = processFile(reader.result);
		createAndSendCompressedFiles(getFileName(file.name), textContent, JSON.stringify(key));
	};

	reader.onerror = () => {
		console.log(reader.error, 'Произошла ошибка!');
	};
}

// Функция для чтения и обработки двух файлов
function handleFilesSelection(firstInput, secondInput) {
	const file1 = firstInput.files[0];
	const file2 = secondInput.files[0];

	if (!file1 || !file2) {
		alert('Выберите два файла');
		return;
	}

	Promise.all([readMultipleFiles(file1), readMultipleFiles(file2)]).then(([content1, content2]) => decompressAndSendFile(content1, content2, getFileName(file1.name)));
}

// Функция для чтения содержимого файла (Promise)
function readMultipleFiles(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => resolve(e.target.result);
		reader.onerror = (e) => reject(e);

		reader.readAsText(file);
	});
}

// Получение имени файла без расширения
function getFileName(text) {
	return text.split('.')[0];
}

// Декомпрессия и отправка файла
function decompressAndSendFile(file, key, filename) {
	const swappedCodes = swapKeysAndValues(JSON.parse(key));
	const decompressedText = performHuffmanDecompression(file, swappedCodes);

	const decompressedFileLink = document.createElement('a');
	const decompressedBlob = new Blob([decompressedText], { type: 'plain/text' });
	const decompressedURL = URL.createObjectURL(decompressedBlob);

	decompressedFileLink.setAttribute('href', decompressedURL);
	decompressedFileLink.setAttribute('download', `${filename}-decompressed.txt`);

	decompressedFileLink.style.display = 'none';
	document.body.appendChild(decompressedFileLink);
	decompressedFileLink.click();
}

// Обмен ключами и значениями в объекте
function swapKeysAndValues(obj) {
	const swappedObj = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			swappedObj[obj[key]] = key;
		}
	}
	return swappedObj;
}

// Декомпрессия с использованием кодировки Хаффмана
function performHuffmanDecompression(compressedText, savedHuffmanCode) {
	let currentCode = '';
	let decompressedText = '';

	for (const bit of compressedText) {
		currentCode += bit;

		if (savedHuffmanCode[currentCode]) {
			decompressedText += savedHuffmanCode[currentCode];
			currentCode = '';
		}
	}

	return decompressedText;
}

// Создание и отправка сжатых файлов и ключа
function createAndSendCompressedFiles(filename, content, key) {
	const compressedFileLink = document.createElement('a');
	const keyFileLink = document.createElement('a');

	const compressedBlob = new Blob([content], { type: 'application/octet-stream' });
	const keyBlob = new Blob([key], { type: 'plain/text' });

	const compressedURL = URL.createObjectURL(compressedBlob);
	const keyURL = URL.createObjectURL(keyBlob);

	compressedFileLink.setAttribute('href', compressedURL);
	compressedFileLink.setAttribute('download', `${filename}.bin`);

	keyFileLink.setAttribute('href', keyURL);
	keyFileLink.setAttribute('download', `${filename}-key.txt`);

	keyFileLink.style.display = 'none';
	document.body.appendChild(keyFileLink);
	keyFileLink.click();

	compressedFileLink.style.display = 'none';
	document.body.appendChild(compressedFileLink);
	compressedFileLink.click();
}

// Чтение файла и подготовка к сжатию
function processFile(text) {
	const frequencyDict = prepareFrequencyDictionary(text);
	const huffmanTree = buildHuffmanTreeStructure(frequencyDict);
	const huffmanCodes = generateHuffmanCodes(huffmanTree);
	const encodedText = performHuffmanEncoding(text, huffmanCodes);

	return [huffmanCodes, encodedText];
}

// Создание словаря частотности символов
function prepareFrequencyDictionary(text) {
	const frequencyDict = {};
	for (const char of text) {
		frequencyDict[char] = (frequencyDict[char] || 0) + 1;
	}
	return frequencyDict;
}

// Класс для узла дерева Хаффмана
class HuffmanNode {
	constructor(char, frequency) {
		this.char = char;
		this.frequency = frequency;
		this.left = null;
		this.right = null;
	}
}

// Построение дерева Хаффмана
function buildHuffmanTreeStructure(frequencyDict) {
	const nodes = Object.keys(frequencyDict).map((char) => new HuffmanNode(char, frequencyDict[char]));

	while (nodes.length > 1) {
		nodes.sort((a, b) => a.frequency - b.frequency);

		const left = nodes.shift();
		const right = nodes.shift();

		const newNode = new HuffmanNode(null, left.frequency + right.frequency);
		newNode.left = left;
		newNode.right = right;

		nodes.push(newNode);
	}

	return nodes[0];
}

// Построение кодов Хаффмана на основе дерева
function generateHuffmanCodes(root) {
	const codes = {};

	function traverse(node, code) {
		if (node.char) {
			codes[node.char] = code;
		} else {
			traverse(node.left, code + '0');
			traverse(node.right, code + '1');
		}
	}

	traverse(root, '');
	return codes;
}

// Кодирование Хаффмана текста
function performHuffmanEncoding(text, codes) {
	let encodedText = '';
	for (const char of text) {
		encodedText += codes[char];
	}
	return encodedText;
}

// Декодирование Хаффмана закодированного текста
function performHuffmanDecoding(encodedText, root) {
	let decodedText = '';
	let currentNode = root;

	for (const bit of encodedText) {
		currentNode = bit === '0' ? currentNode.left : currentNode.right;

		if (currentNode.char) {
			decodedText += currentNode.char;
			currentNode = root;
		}
	}

	return decodedText;
}
