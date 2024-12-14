import * as Font from 'expo-font';

export const fetchFonts = () => {
  return Font.loadAsync({
    Arial: require('../assets/fonts/arial.ttf'),
    'Arial Narrow': require('../assets/fonts/arialn.ttf'),
    'Comic Sans MS': require('../assets/fonts/comic.ttf'),
    'Courier New': require('../assets/fonts/cour.ttf'),
    Garamond: require('../assets/fonts/gara.ttf'),
    Georgia: require('../assets/fonts/georgia.ttf'),
    Helvetica: require('../assets/fonts/Helvetica.ttf'),
    Impact: require('../assets/fonts/impact.ttf'),
    'Lucida Console': require('../assets/fonts/lucon.ttf'),
    Verdana: require('../assets/fonts/verdana.ttf'),
    'MS Sans Serif': require('../assets/fonts/msSansSerif.ttf'),
    'MS Serif': require('../assets/fonts/msSansSerif.ttf'),
    'Palatino Linotype': require('../assets/fonts/pala.ttf'),
    Tahoma: require('../assets/fonts/tahoma.ttf'),
    'Times New Roman': require('../assets/fonts/times.ttf'),
    'Trebuchet MS': require('../assets/fonts/trebuc.ttf'),
  });
};