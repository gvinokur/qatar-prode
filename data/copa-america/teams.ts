
const team =  (name:string, short_name:string, primary_color:string, secondary_color:string) => ({
  name,
  short_name,
  primary_color,
  secondary_color
})

export const teams = [
  team('Argentina', 'ARG','#44A4FF', '#FFFFFF'),
  team('Bolivia', 'BOL', '#387D41', '#F1D736'),
  team('Brasil', 'BRA','#05B147', '#FFDA20'),
  team('Canada', 'CAN', '#FF191E', '#FFFFFF'),
  team('Chile', 'CHI', '#C32827', '#32409A'),
  team('Colombia', 'COL','#F4D137', '#25408F'),
  team('Costa Rica', 'CRC','#14337A', '#EE1922'),
  team('Ecuador', 'ECU', '#F4D037', '#25418F'),
  team('Estados Unidos', 'USA', '#39376F', '#CF1C31'),
  team('Jamaica', 'JAM', '#009B40', '#FFD100'),
  team('Mexico', 'MEX','#006843', '#FFFFFF'),
  team('Panama', 'PAN','#F41934', '#005195'),
  team('Paraguay', 'PAR','#32409A', '#BA2033'),
  team('Peru', 'Per', '#BA2033', '#FFFFFF'),
  team('Uruguay', 'URU', '#3777BC', '#FFFFFF'),
  team('Venezuela', 'VEN', '#BA2033', '#32409A')
]
