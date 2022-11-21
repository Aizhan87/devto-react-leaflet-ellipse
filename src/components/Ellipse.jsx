import React, { useEffect, useRef } from 'react'
import L from 'leaflet';
import {useLeafletContext} from '@react-leaflet/core';
import {useMap} from 'react-leaflet';
import {
  createElementHook,
  createPathHook,
  createContainerComponent,
  createPathComponent
} from '@react-leaflet/core'
import 'leaflet-ellipse'

function createEllipse(props, context) {
  const instance = new L.Ellipse(
    props.center,
    props.radii,
    props.tilt,
    props.options
  )
  return {
    instance,
    context: { ...context, overlayContainer: instance },
  }
}
function updateEllipse(instance, props, prevProps) {
  if (
    props.center !== prevProps.center ||
    props.radii !== prevProps.radii ||
    props.tilt !== prevProps.tilt ||
    props.options !== prevProps.options
  ) {
    instance.setLatLng(props.center)
    instance.setRadius(props.radii)
    instance.setTilt(props.tilt)
    instance.setStyle(props.options)
  }
}

const Ellipse = createPathComponent(createEllipse, updateEllipse)
export default Ellipse