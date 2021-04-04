# Creating an Ellipse in React-Leaflet

[Edit on StackBlitz ⚡️](https://stackblitz.com/edit/devto-react-leaflet-ellipse)

![Leaflet map with ellipses and markers](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k9bvb7z4mfgh6kghcs9k.png)
If you use [React-Leaflet](https://react-leaflet.js.org/) in your mapping applications, there may come a time when you need to display data in the form of an [ellipse](http://wiki.gis.com/wiki/index.php/Ellipse) on your map. [Leaflet](https://leafletjs.com/index.html) does not provide an ellipse marker by default, which means that React-Leaflet does not supply one either. In the [Leaflet plugins section](https://leafletjs.com/plugins.html) of the [Leaflet documentation](https://leafletjs.com/reference-1.7.1.html), there is a plugin called [Leaflet.Ellipse](https://github.com/jdfergason/Leaflet.Ellipse#leafletellipse) that allows users to create an ellipse in a vanilla Leaflet app. But, how does one get this plugin to work with their React-Leaflet app?

The answer is to use the [React Leaflet Core API](https://react-leaflet.js.org/docs/core-introduction). The purpose of the Core API is to make React-Leaflet's internal logic available so devs like ourselves can implement our own custom behaviors and third-party plugins. To better understand how this API works, let's extend `Leaflet.Ellipse` to work with React-Leaflet by creating our own Ellipse component.

To make things simple, I have created a React-Leaflet template hosted on [Stack Blitz](https://stackblitz.com/edit/devto-react-leaflet-ellipse?file=src/components/Map.jsx) so you don't have to worry about set up. If you want to code along on your local machine, you can always follow the React-Leaflet [Getting Started guide](https://react-leaflet.js.org/docs/start-introduction) to get going.

---

### Simple Implementation

For right now, let's just focus on getting our ellipse on the map. Let's create a new file named **Ellipse.jsx** in our components directory:

##### Ellipse.jsx

```javascript
import React, { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-ellipse'
import { useLeafletContext } from '@react-leaflet/core'

const Ellipse = (props) => {
  const context = useLeafletContext()

  const { center, radii, tilt, options } = props

  useEffect(() => {
    const ellipse = new L.Ellipse(center, radii, tilt, options)

    const container = context.layerContainer || context.map
    container.addLayer(ellipse)

    return () => {
      container.removeLayer(ellipse)
    }
  })

  return null
}

export default Ellipse
```

First, we use the [`useLeafletContext` hook](https://react-leaflet.js.org/docs/core-api#useleafletcontext) from the Core API to access the context created by the [`MapContainer` component](https://react-leaflet.js.org/docs/api-map#mapcontainer) in `Map.jsx`. We will also destructure the necessary bits of data from props:

```javascript
const context = useLeafletContext()

const { center, radii, tilt, options } = props
```

Next, we use [React's `useEffect` hook](https://reactjs.org/docs/hooks-effect.html) to create the `L.Ellipse` instance by passing the following to the `Ellipse` [constructor](https://github.com/jdfergason/Leaflet.Ellipse#api):

- **center** - The position of the center of the ellipse [lat, lng].
- **radii** - The semi-major and semi-minor axis in meters
- **tilt** - The rotation of the ellipse in degrees from west
- **options** - Options dictionary to pass to L.Path

```javascript
const ellipse = new L.Ellipse(center, radii, tilt, options)
```

Now that we have our ellipse instance set up, the layer needs to be added to the container provided to us via the context. This will be either a parent container like a [LayerGroup](https://react-leaflet.js.org/docs/api-components#layergroup), or the Map instance:

```javascript
const container = context.layerContainer || context.map
container.addLayer(ellipse)
```

At the end of the `useEffect` hook, we are going to return a [cleanup function](https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup) that will remove our ellipse from its parent container:

```javascript
return () => {
  container.removeLayer(ellipse)
}
```

Notice how we are returning a `null` value at the end of the component. Returning `null` from a component just means that React will be evaluating our component, but not rendering anything. Usually, we would need to return a valid React node from our components, but since Leaflet will be performing the rendering, we only return a `null` value.

We can now import our `Ellipse` component to our `Map` component and `.map` through our city data to place our ellipses:

##### Map.jsx

```javascript
// ...imports
import Ellipse from './Ellipse'

const Map = () => {
  // ... state hooks...

  return (
    <>
      <MapContainer
        center={[38, -82]}
        zoom={4}
        zoomControl={false}
        style={{ height: '100vh', width: '100%', padding: 0 }}
        whenCreated={(map) => setMap(map)}
      >
        {/* ... other layers... */}
        <LayersControl.Overlay checked name='Ellipses'>
          <LayerGroup>
            {cities.map((city) => (
              <>
                <Ellipse
                  center={[city.lat, city.lng]}
                  radii={[city.semimajor, city.semiminor]}
                  tilt={city.tilt}
                  options={city.options}
                />
              </>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
        {/* ... other layers... */}
      </MapContainer>
    </>
  )
}
```

---

### Improving the Update Logic

The `Ellipse` component we have built thus far will work just fine for most simple cases, but there is a catch. With every render of the component, the `useEffect` callback will run and add/remove the ellipse to/from the map even if the props haven't changed.

When working with React, this is not the expected behavior since the virtual DOM checks which updates are necessary to apply to the DOM. Since we are using React-Leaflet, the [DOM rendering is being performed by Leaflet](https://react-leaflet.js.org/docs/start-introduction/#core-concepts) so we will need to improve our update logic to avoid unnecessary changes to the DOM:

##### Ellipse.jsx

```javascript
import React, { useEffect, useRef } from 'react'
// ...imports

const Ellipse = (props) => {
  const context = useLeafletContext()
  const ellipseRef = useRef()
  const propsRef = useRef(props)

  const { center, radii, tilt, options } = props

  useEffect(() => {
    ellipseRef.current = new L.Ellipse(center, radii, tilt, options)

    const container = context.layerContainer || context.map
    container.addLayer(ellipseRef.current)

    return () => {
      container.removeLayer(ellipseRef.current)
    }
  }, [])

  useEffect(() => {
    if (
      center !== propsRef.center ||
      radii !== propsRef.radii ||
      tilt !== propsRef.tilt ||
      options !== propsRef.options
    ) {
      ellipseRef.current.setLatLng(center)
      ellipseRef.current.setRadius(radii)
      ellipseRef.current.setTilt(tilt)
      ellipseRef.current.setStyle(options)
    }
    propsRef.current = props
  }, [center, radii, tilt, options])

  return null
}

export default Ellipse
```

Here, we create references to our Leaflet Ellipse instance and its props by using [React's `useRef` hook](https://reactjs.org/docs/hooks-reference.html#useref) :

```javascript
const ellipseRef = useRef()
const propsRef = useRef(props)
```

We are going to separate the ellipse creation logic from the update logic by placing them in separate `useEffect` callbacks. We want the first `useEffect` callback to only run when the ellipse component is mounted and unmounted, so we set the dependency array to an empty array:

```javascript
useEffect(() => {
  ellipseRef.current = new L.Ellipse(center, radii, tilt, options)

  const container = context.layerContainer || context.map
  container.addLayer(ellipseRef.current)

  return () => {
    container.removeLayer(ellipseRef.current)
  }
}, [])
```

We are going to want to call the second `useEffect` whenever the data from props changes so that Leaflet can conditionally apply any updates to our ellipse layer. This means we simply pass the data we destructured from props to the second `useEffect`'s dependency array. We can find out what methods we need to call to update our ellipse by taking a look at the [`Leaflet.Ellipse` source file](https://github.com/jdfergason/Leaflet.Ellipse/blob/master/l.ellipse.js) starting at line 63:

```javascript
useEffect(() => {
  if (
    center !== propsRef.current.center ||
    radii !== propsRef.current.radii ||
    tilt !== propsRef.current.tilt ||
    options !== propsRef.current.options
  ) {
    ellipseRef.current.setLatLng(center)
    ellipseRef.current.setRadius(radii)
    ellipseRef.current.setTilt(tilt)
    ellipseRef.current.setStyle(options)
  }
  propsRef.current = props
}, [center, radii, tilt, options])
```

---

### Element Hook Factory

What we have so far is a fully functional `Ellipse` component for our React-Leaflet application, but the Core API provides functions like the [`createElementHook` factory](https://react-leaflet.js.org/docs/core-api/#createelementhook) to make the process a bit easier and remove some of the repetitive code:

```javascript
import { useLeafletContext, createElementHook } from '@react-leaflet/core'

function createEllipse(props, context) {
  return {
    instance: new L.Ellipse(
      props.center,
      props.radii,
      props.tilt,
      props.options
    ),
    context,
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

const useEllipseElement = createElementHook(createEllipse, updateEllipse)

const Ellipse = (props) => {
  const context = useLeafletContext()
  const elementRef = useEllipseElement(props, context)

  useEffect(() => {
    const container = context.layerContainer || context.map
    container.addLayer(elementRef.current.instance)

    return () => {
      container.removeLayer(elementRef.current.instance)
    }
  }, [])

  return null
}

export default Ellipse
```

Rather than keeping our creation and update logic in `useEffect` callbacks, we can extract them to stand-alone functions that implement the [interface expected by the `createElementHook` function](https://react-leaflet.js.org/docs/core-api/#createelementhook):

```javascript
function createEllipse(props, context) {
  return {
    instance: new L.Ellipse(
      props.center,
      props.radii,
      props.tilt,
      props.options
    ),
    context,
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
```

Then, we take these create and update functions and pass them to the `createElementHook` factory function:

```javascript
const useEllipseElement = createElementHook(createEllipse, updateEllipse)
```

This hook tracks the Ellipse element's instance and props, which means we only need one `useEffect` hook to add/remove our Ellipse layer to/from the map:

```javascript
const elementRef = useEllipseElement(props, context)

useEffect(() => {
  const container = context.layerContainer || context.map
  container.addLayer(elementRef.current.instance)

  return () => {
    container.removeLayer(elementRef.current.instance)
  }
}, [])
```

---

### Layer lifecycle hook

The Core API provides hooks designed to handle specific pieces of logic, such as the [`useLayerLifecycle` hook](https://react-leaflet.js.org/docs/core-api/#uselayerlifecycle). This hook's whole purpose is to take care of adding and removing the assigned layer to and from the parent container or map. Let's use this and get rid of the `useEffect` hook that is currently handling the add/remove logic:

```javascript
import {
  useLeafletContext,
  createElementHook,
  useLayerLifecycle,
} from '@react-leaflet/core'

// ... create and update functions

// ... createElementHook

const Ellipse = (props) => {
  const context = useLeafletContext()
  const elementRef = useEllipseElement(props, context)
  useLayerLifecycle(elementRef.current, context)

  return null
}
```

---

### Higher-level createPathHook

We also have access to higher-level factory functions via the Core API. These higher-level factory functions, like the [`createPathHook` function](https://react-leaflet.js.org/docs/core-api/#createpathhook), implement logic that is shared by different hooks. If we want to simplify our `Ellipse` component even more, we can get rid of the `useLeafletContext` and `useLayerLifecycle` functions, and just call the hook we create with `createPathHook` inside the Ellipse component:

```javascript
import { createElementHook, createPathHook } from '@react-leaflet/core'

// ... create and update functions

const useEllipseElement = createElementHook(createEllipse, updateEllipse)
const useEllipse = createPathHook(useEllipseElement)

const Ellipse = (props) => {
  useEllipse(props)

  return null
}
```

---

### Component factory

Now that all of the logic for our `Ellipse` component is implemented in the `useEllipse` hook we have created, the component has become incredibly simple. We can actually take our functional component and replace it with the [`createLeafComponent` function](https://react-leaflet.js.org/docs/core-api/#createleafcomponent), which also allows us to now access our `Ellipse` instance with [React's `ref`](https://reactjs.org/docs/refs-and-the-dom.html):

```javascript
import {
  createElementHook,
  createPathHook,
  createLeafComponent,
} from '@react-leaflet/core'

// ... create and update functions

const useEllipseElement = createElementHook(createEllipse, updateEllipse)
const useEllipse = createPathHook(useEllipseElement)

const Ellipse = createLeafComponent(useEllipse)

export default Ellipse
```

---

### Supporting child elements

Our `Ellipse` component works great, with all of our logic implented in just a few lines of code. The problem with our ellipse now is that it doesn't yet support children, which is a fairly common requirement for React-Leaflet components. Since our `Ellipse` is a Leaflet layer, we can attach overlays like [`Popups`](https://react-leaflet.js.org/docs/example-popup-marker) and [`Tooltips`](https://react-leaflet.js.org/docs/example-tooltips) to our `Ellipse`:

##### Ellipse.jsx

```javascript
import {
  createElementHook,
  createPathHook,
  createContainerComponent,
} from '@react-leaflet/core'

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

// ... update function

const useEllipseElement = createElementHook(createEllipse, updateEllipse)
const useEllipse = createPathHook(useEllipseElement)
const Ellipse = createContainerComponent(useEllipse)
```

##### Map.jsx

```javascript
// ...Map component
<LayersControl.Overlay checked name='Ellipses'>
  <LayerGroup>
    {cities.map((city) => (
      <>
        <Ellipse
          center={[city.lat, city.lng]}
          radii={[city.semimajor, city.semiminor]}
          tilt={city.tilt}
          options={city.options}
        >
          <Popup>This is quality popup content.</Popup>
        </Ellipse>
      </>
    ))}
  </LayerGroup>
</LayersControl.Overlay>
// ...Map component
```

To support these overlays, we need to set the created layer as the context's `overlayContainer` in our `createEllipse` function. Remember, the context object returned from the `createEllipse` function **must be a copy of the one provided in the function arguments** and the function **must not mutate the provided context**:

```javascript
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
```

Then, we replace the component factory with the[`createContainerComponent` factory function](https://react-leaflet.js.org/docs/core-api/#createcontainercomponent). The[`createLeafComponent` function](https://react-leaflet.js.org/docs/core-api/#createleafcomponent) and [`createOverlayComponent` function](https://react-leaflet.js.org/docs/core-api/#createoverlaycomponent) can also be used to create overlays, like popups and tooltips:

```javascript
const Ellipse = createContainerComponent(useEllipse)
```

---

### Higher-level component factory

Most of what React Leaflet's Core API provides are React components that handle the logic for creating and interacting with our Leaflet elements. These different hooks and factories that are exposed by the API implement various pieces of logic that need to be combined to create components, and in some cases the same series of functions are used to create different components. Take a look at the functions we used to create our Ellipse:

```javascript
const useEllipseElement = createElementHook(createEllipse, updateEllipse)
const useEllipse = createPathHook(useEllipseElement)
const Ellipse = createContainerComponent(useEllipse)
```

We can use these functions to create many different types of layers so React-Leaflet provides a higher-level component factories, like the [`createPathComponent` function](https://react-leaflet.js.org/docs/core-api/#createpathcomponent), that combines the logic of all three. We can remove the functions above and pass our create and update functions directly to the `createPathComponent` factory, like so:

##### Ellipse.jsx

```javascript
const Ellipse = createPathComponent(createEllipse, updateEllipse)
```

---

### Conclusion

Our `Ellipse` component is now finished! We were able to get it done in just a few lines of code and, thanks to the React-Leaflet Core API, we have a fully interactive Leaflet layer. We've gone over a lot regarding the Core API, but there is still plenty more. I encourage you to try and create your own custom React-Leaflet elements or extend a third-party Leaflet plugin to work in your React-Leaflet application. If you do, blog about it and share your link below to help out fellow devs! If you catch any errors here or have any suggestions, feel free to let me know. Thanks for reading!
