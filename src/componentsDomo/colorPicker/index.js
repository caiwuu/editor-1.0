import Palette from './palette'
import Hue from './hue'
import { Component, createRef } from '../../core'
export default class ColorPicker extends Component {
  constructor(props) {
    super(props)
    this.paletteRef = createRef()
    this.hueRef = createRef()
  }
  render() {
    return (
      <div style='font-size:0;width:228px;'>
        <Palette ref={this.paletteRef} hue={this.hueRef}></Palette>
        <Hue ref={this.hueRef} color={this.props.color} paletteRef={this.paletteRef}></Hue>
      </div>
    )
  }
  onMounted() {
    console.log('ColorPicker')
  }
}
