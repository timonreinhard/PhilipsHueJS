PhilipsHueJS
=====

A simple JS library allowing conversion to and from XY values factoring gamma correction and colour gamut for the Philips Hue.

More information about the conversion can be found [here](https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md).


##Example
```javascript

//Returns a CGPoint object containing the X and Y properties
PhilipsHue.HSLToXY(Hue, Saturation, Lightness, TypeOrModel);

//Returns a CGPoint object containing the X and Y properties
PhilipsHue.RGBToXY(Red, Green, Blue, TypeOrModel);

//Returns an object with the properties Red, Green and Blue
PhilipsHue.XYToRGB(Point, TypeOrModel);
```

###Types and Models

The last parameter allows specifying a specific model or the generic type which is then used to work out the closest colour gamut that can be set.

This library supports finding the closest colour gamut of these models:

* Under the type "hueBulbs"
 * LCT001
 * LCT002
 * LCT003
* Under the type "livingColors"
 * LLC001
 * LLC005
 * LLC006
 * LLC007
 * LLC011
 * LLC012
 * LLC013
 * LST001

With no type or model being set, it will use a default setting.


##The fine print

This is in no way associated with Philips or the Hue lightbulbs. All trademarks belong to the registered owners.