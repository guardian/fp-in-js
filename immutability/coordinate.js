function coordinate(lat, long) {
   const _lat = lat;
   const _long = long;
   return {
      latitude: function () {
         return _lat;
      },
      longitude: function () {
         return _long;
      },
      translate: function (dx, dy) {
         return coordinate(_lat + dx, _long + dy);
      },
      toString: function () {
         return '(' + _lat + ',' + _long + ')';
      }
   }
}
const greenwich = coordinate(51.4778, 0.0015);
const nearGreenwich = greenwich.translate(1, 1);

greenwich.toString();
nearGreenwich.toString();