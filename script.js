/*Создание карты*/

var map = L.map('map').setView([59.919662, 30.466976], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  minZoom: 15,
}).addTo(map);

/*Создание границ карты*/

var corner1 = L.latLng(59.937816, 30.377197),   
corner2 = L.latLng(59.864815, 30.516586),
bounds = L.latLngBounds(corner1, corner2);
map.setMaxBounds(bounds)
/*Создание своих иконок*/
var activeIcon = L.icon({
    iconUrl: "media/icons/marker_active.png",
    popupAnchor:  [0, -40]
});
var inactiveIcon = L.icon({
    iconUrl: "media/icons/marker_unactive.png",
    popupAnchor:  [0, -40]
});




/*Поведение маркера и попапа*/
function createMarkerWithPopup(latLng, schoolId) {
    var marker = L.marker(latLng).addTo(map);

    checkAndSetMarkerIcon(schoolId, marker, activeIcon, inactiveIcon);
    // Создаем попап
    var popup = L.popup({ closeButton: false });
    
    // Получаем содержимое попапа
    popupContentById(schoolId)
        .then(content => {
            // Устанавливаем содержимое попапа после получения
            popup.setContent(content);
        })
        .catch(error => {
            console.error('Error fetching popup content:', error);
            popup.setContent('Пока что нет контента');
        });

    var isHovered = false;

    marker.bindPopup(popup);


    marker.on("mouseover", function () {
        marker.openPopup();
    });

    marker.on("mouseout", function () {
        timer = setTimeout(function () {
            if (!isHovered) {
                marker.closePopup(); //таймаут 0.2с
            }
        }, 200);
    });

    marker.on("popupopen", function () {
        marker._popup._container.addEventListener('mouseenter', () => {
            isHovered = true;
        });
        marker._popup._container.addEventListener('mouseleave', () => {
            marker.closePopup();
            isHovered = false;
        });
    });

    popup.on("mouseout", function () {
        marker.closePopup(); // Закрываем попап при уходе с него
    });

    marker.on("click", function () {
        playVideoById(schoolId);
    });


    return marker;
}
/*Реализация контента попапа*/
async function popupContentById(id) {
    try {
        var fileUrl = `media/school_${id}.txt`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${fileUrl}`);
        }
        
        const fileContent = await response.text();
        
        return fileContent;
    } catch (error) {
        console.error('Error fetching file:', error);
        throw error; // Пробросить ошибку для обработки вне этой функции
    }
}


function playVideoById(schoolId) {
    
    var videoContainer = document.getElementById('video-container');
    var overlay = document.getElementById('overlay');
    

    
    // Формируем путь к видео на основе айди школы
    var videoPath = 'media/school_' + schoolId + '.mp4';

    // Проверяем, существует ли файл
    fetch(videoPath)
        .then(response => {
            if (!response.ok) {
                console.error('Video not found:', videoPath);

                return;
            }
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();

            // Устанавливаем путь к видео
            var video = document.querySelector('video');
            video.src = videoPath;

            // Открываем плеер
            
            videoContainer.style.display = 'block';
            overlay.style.display = 'block'

            // Воспроизводим видео
            
        })
        .catch(error => {
            console.error('Error checking video existence:', error);
        });
        
}


//закрытие видео
function closeVideo() {
    var videoContainer = document.getElementById('video-container');
    var overlay = document.getElementById('overlay');
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    
    videoContainer.style.display = 'none';
    overlay.style.display = 'none'

    // Остановить видео при закрытии
    var video = document.querySelector('video');
    video.pause();
    video.currentTime = 0;
}
/*Проверка существования видео по айди*/
function videoExistanceById(id) {
    var videoPath = 'media/school_' + id + '.mp4';
    return fetch(videoPath)
        .then(response => {
            if (!response.ok) return false;
            else return true;
            
        });
}
async function checkAndSetMarkerIcon(schoolId, marker, activeIcon, inactiveIcon) {
    try {
        const videoExists = await videoExistanceById(schoolId);
        if (videoExists) {
            marker.setIcon(activeIcon);
        } else {
            marker.setIcon(inactiveIcon);
        }
    } catch (error) {
        console.error('Error occurred while checking video existence:', error);
        
    }
}
// map.on('click', function(e) {
//     alert("["+ e.latlng.lat + ", " + e.latlng.lng+"]")
// });


/*Создание маркеров по их кординатам и айди школы*/
$.getJSON('schools.json', function(data) {
    
    data.schools.forEach(function(school) {
        var latLng = L.latLng(school.latLng[0], school.latLng[1]); // Создание объекта L.latLng из массива координат
        createMarkerWithPopup(latLng, school.id); // Передача координат и id школы методу createMarkerWithPopup
    });
}).fail(function(jqXHR, textStatus, errorThrown) {
    // Обработка ошибок
    console.error('Ошибка при загрузке данных o школах:', errorThrown);
});


