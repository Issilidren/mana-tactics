export const FRAME = {
  white:     { border:'#C8A820', glow:'#F0D050', header:'#E8D060', headerText:'#1a1000', art1:'#F0E8A0', art2:'#C8A030' },
  blue:      { border:'#1144AA', glow:'#4488EE', header:'#1A66CC', headerText:'#DDEEFF', art1:'#4488EE', art2:'#0A2288' },
  black:     { border:'#8833CC', glow:'#BB66FF', header:'#5522AA', headerText:'#EEE0FF', art1:'#9955CC', art2:'#1A0830' },
  red:       { border:'#CC2200', glow:'#FF5533', header:'#EE3311', headerText:'#FFEEEE', art1:'#FF6633', art2:'#881100' },
  green:     { border:'#117711', glow:'#44DD44', header:'#228833', headerText:'#EEFFEE', art1:'#55CC44', art2:'#114411' },
  colorless: { border:'#666677', glow:'#9999AA', header:'#888899', headerText:'#FFFFFF', art1:'#BBBBCC', art2:'#555566' },
}

export function artUrl(url) { return url?.replace('/small/', '/art_crop/') ?? null }
