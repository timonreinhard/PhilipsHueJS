//More Information: https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md
//https://github.com/Q42/hue-color-converter
//https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Conversions/XyzConverter.cs

var PhilipsHue = {
	//eg. Hue = 180, Saturation = 100, Luminance = 50, Type = "hueBulbs"/"livingColors"/"default"
	HSLToXY: function(Hue, Saturation, Luminance, TypeOrModel)
	{
		var rgb = this.Utilities.HSLToRGB(Hue, Saturation, Luminance);
		return this.RGBToXY(rgb.Red, rgb.Green, rgb.Blue, TypeOrModel);
	},
	//eg. Red = 240, Green = 200, Blue = 190, Type = "hueBulbs"/"livingColors"/"default"
	RGBToXY: function(Red, Green, Blue, TypeOrModel)
	{
		//Makes the value between 0 and 1
		Red = Red / 255;
		Green = Green / 255;
		Blue = Blue / 255;

		//Apply Gamma correction
		Red = this.Utilities.PivotRGB(Red);
		Green = this.Utilities.PivotRGB(Green);
		Blue = this.Utilities.PivotRGB(Blue);

		//Convert RGB values to XYZ
		var x = Red * 0.649926 + Green * 0.103455 + Blue * 0.197109;
		var y = Red * 0.234327 + Green * 0.743075 + Blue * 0.022598;
		var z = Red * 0.000000 + Green * 0.053077 + Blue * 1.035763;

		//Calculate XY values from XYZ
		var cx = x / (x + y + z);
		var cy = y / (x + y + z);

		if (isNaN(cx))
		{
			cx = 0.0;
		}

		if (isNaN(cy))
		{
			cy = 0.0;
		}

		//Check reach of lamp
		var xyPoint = new CGPoint(cx, cy);
		var colourPoints = this.Utilities.GetColourPointsForModel(TypeOrModel);
		var inReachOfLamps = this.Utilities.CheckPointInLampsReach(xyPoint, colourPoints);

		if (!inReachOfLamps)
		{
			var pAB = this.Utilities.GetClosestPointToPoints(colourPoints.Red, colourPoints.Green, xyPoint);
			var pAC = this.Utilities.GetClosestPointToPoints(colourPoints.Blue, colourPoints.Red, xyPoint);
			var pBC = this.Utilities.GetClosestPointToPoints(colourPoints.Green, colourPoints.Blue, xyPoint);
			var dAB = this.Utilities.GetDistanceBetweenTwoPoints(xyPoint, pAB);
			var dAC = this.Utilities.GetDistanceBetweenTwoPoints(xyPoint, pAC);
			var dBC = this.Utilities.GetDistanceBetweenTwoPoints(xyPoint, pBC);
			var lowest = dAB;
			var closestPoint = pAB;

			if (dAC < lowest)
			{
				lowest = dAC;
				closestPoint = pAC;
			}

			if (dBC < lowest)
			{
				lowest = dBC;
				closestPoint = pBC;
			}

			cx = closestPoint.X;
			cy = closestPoint.Y;
		}
		
		var luminance = y;

		return new CGPoint(cx, cy, luminance);
	},
	XYToRGB: function(Point, TypeOrModel)
	{
		//Check reach of lamp
		/*var colourPoints = this.Utilities.GetColourPointsForModel(TypeOrModel);
		var inReachOfLamps = this.Utilities.CheckPointInLampsReach(Point, colourPoints);

		if (!inReachOfLamps)
		{
			var pAB = this.Utilities.GetClosestPointToPoints(colourPoints.Red, colourPoints.Green, Point);
			var pAC = this.Utilities.GetClosestPointToPoints(colourPoints.Blue, colourPoints.Red, Point);
			var pBC = this.Utilities.GetClosestPointToPoints(colourPoints.Green, colourPoints.Blue, Point);
			var dAB = this.Utilities.GetDistanceBetweenTwoPoints(Point, pAB);
			var dAC = this.Utilities.GetDistanceBetweenTwoPoints(Point, pAC);
			var dBC = this.Utilities.GetDistanceBetweenTwoPoints(Point, pBC);
			var lowest = dAB;
			var closestPoint = pAB;

			if (dAC < lowest)
			{
				lowest = dAC;
				closestPoint = pAC;
			}

			if (dBC < lowest)
			{
				lowest = dBC;
				closestPoint = pBC;
			}

			Point.X = closestPoint.X;
			Point.Y = closestPoint.Y;
		}*/

		var x = Point.X;
		var y = Point.Y;
		var z = Point.getZ();

		var Y = Point.Luminance;
		var X = (Y / y) * x;

		if (isNaN(X))
		{
			X = 0;
		}

		var Z = (Y / y) * z;

		if (isNaN(Z))
		{
			Z = 0;
		}
		
		var r = X * 1.612 - Y * 0.203 - Z * 0.302;
		var g = -X * 0.509 + Y * 1.412 + Z * 0.066;
		var b = X * 0.026 - Y * 0.072 + Z * 0.962;

		//Apply Gamma Correctyion
		r = this.Utilities.PivotRGB(r, true);
		g = this.Utilities.PivotRGB(g, true);
		b = this.Utilities.PivotRGB(b, true);
		
		r *= 255;
		r = Math.round(r > 255 ? 255 : (r < 0 ? 0 : r));
		
		g *= 255;
		g = Math.round(g > 255 ? 255 : (g < 0 ? 0 : g));
		
		b *= 255;
		b = Math.round(b > 255 ? 255 : (b < 0 ? 0 : b));
		
		
		return { Red: r, Green: g, Blue: b };
	},
	API: {
		SendRequestRaw: function(Url, Method, Data, Callback)
		{
			var xmlhttp = new XMLHttpRequest();
			if (typeof Callback == "function")
			{
				xmlhttp.onreadystatechange = function()
				{
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
					{
						Callback(JSON.parse(xmlhttp.responseText));
					}
				}
			}
			xmlhttp.open(Method, Url);
			xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			xmlhttp.send(Method != "GET" ? JSON.stringify(Data) : null);
		},
		ChangeState: function(Host, Light, Data, Callback)
		{
			this.SendRequestRaw("http://" + Host + "/api/newdeveloper/lights/" + Light + "/state", "PUT", Data, Callback);
		},
		GetLight: function(Host, Light, Callback)
		{
			this.SendRequestRaw("http://" + Host + "/api/newdeveloper/lights/" + Light + "/", "GET", null, Callback);
		},
		SetXY: function(Host, Light, Point, Callback)
		{
			var luminance = Math.round(Point.Luminance * 255);
			this.ChangeState(Host, Light, { "xy" : [ Math.round(Point.X * 10000) / 10000, Math.round(Point.Y * 10000) / 10000 ], "bri": luminance }, Callback);
		},
		GetXY: function(Host, Light, Callback)
		{
			this.GetLight(Host, Light, function(Properties)
			{
				var xy = Properties.state.xy;
				var luminance = Properties.state.bri / 255;
				
				Callback(new CGPoint(xy[0], xy[1], luminance));
			});
		},
		SetHSL: function(Host, Light, Hue, Saturation, Luminance, Callback)
		{
			Hue = Math.round(Hue * (65535 / 360));
			Saturation = Math.round(Saturation * (255 / 100));
			Luminance = Math.round(Luminance * (255 / 100));
			
			this.ChangeState(Host, Light, { "hue": Hue, "sat": Saturation, "bri": Luminance }, Callback);
		},
		GetHSL: function(Host, Light, Callback)
		{
			this.GetLight(Host, Light, function(Properties)
			{
				//var hue = Math.round(Properties.state.hue / (65535 / 360));
				//var saturation = Math.round(Properties.state.sat / (255 / 100));
				//var luminance = Math.round(Properties.state.bri / (255 / 100));
				
				var hue = Properties.state.hue / 65535;
				var saturation = Properties.state.sat / 255;
				var luminance = Properties.state.bri / 255;
				
				Callback({ Hue: hue, Saturation: saturation, Luminance: luminance });
			});
		}
	},
	Utilities: {
		PivotRGB: function(RGBColour, Reverse)
		{
			if (typeof Reverse != 'boolean')
			{
				return (RGBColour > 0.04045 ? Math.pow((RGBColour + 0.055) / 1.055, 2.4) : RGBColour / 12.92);
			}
			else
			{
				return (RGBColour <= 0.0031308 ? 12.92 * RGBColour : (1.055) * Math.pow(RGBColour, (1.0 / 2.4)) - 0.055);
			}
		},
		GetColourPointsForModel: function(Model)
		{
			var type = Model;

			switch (Model)
			{
				case "LCT001":
				case "LCT002":
				case "LCT003":
					type = "hueBulbs";
				break;
				case "LLC001":
				case "LLC005":
				case "LLC006":
				case "LLC007":
				case "LLC011":
				case "LLC012":
				case "LLC013":
				case "LST001":
					type = "livingColors";
				break;
			}

			return this.GetColourPointsForType(type);
		},
		GetColourPointsForType: function(Type)
		{
			if (Type == "hueBulbs")
			{
				return {
					Red: new CGPoint(0.675, 0.322),
					Green: new CGPoint(0.408, 0.517),
					Blue: new CGPoint(0.167, 0.04)
				};
			}
			else if (Type == "livingColors")
			{
				return {
					Red: new CGPoint(0.703, 0.296),
					Green: new CGPoint(0.214, 0.709),
					Blue: new CGPoint(0.139, 0.081)
				};
			}
			else
			{
				return {
					Red: new CGPoint(1.0, 0.0),
					Green: new CGPoint(0.0, 1.0),
					Blue: new CGPoint(0.0, 0.0)
				};
			}
		},
		GetCrossProduct: function(Point1, Point2)
		{
			return Point1.X * Point2.Y - Point1.Y * Point2.X;
		},
		GetClosestPointToPoints: function(PointA, PointB, PointP)
		{
			var ap = new CGPoint(PointP.X - PointA.X, PointP.Y - PointA.Y);
			var ab = new CGPoint(PointB.X - PointA.X, PointB.Y - PointA.Y);
			var ab2 = ab.X * ab.X + ab.Y * ab.Y;
			var ap_ab = ap.X * ab.X + ap.Y * ab.Y;
			var t = ap_ab / ab2;

			if (t < 0.0)
			{
				t = 0.0;
			}
			else if (t > 1.0)
			{
				t = 1.0;
			}

			return new CGPoint(PointA.X + ab.X * t, PointA.Y + ab.Y * t);
		},
		GetDistanceBetweenTwoPoints: function(Point1, Point2)
		{
			var dx = Point1.X - Point2.X;
			var dy = Point1.Y - Point2.Y;
			return Math.sqrt(dx * dx + dy * dy);
		},
		CheckPointInLampsReach: function(Point, ColourPoints)
		{
			var red = ColourPoints.Red;
			var green = ColourPoints.Green;
			var blue = ColourPoints.Blue;
			var v1 = new CGPoint(green.X - red.X, green.Y - red.Y);
			var v2 = new CGPoint(blue.X - red.X, blue.Y - red.Y);
			var q = new CGPoint(Point.X - red.X, Point.Y - red.Y);
			var s = this.GetCrossProduct(q, v2) / this.GetCrossProduct(v1, v2);
			var t = this.GetCrossProduct(v1, q) / this.GetCrossProduct(v1, v2);

			return (s >= 0.0 && t >= 0.0 && s + t < 1.0);
		},
		XYInReachOfLamp: function(Point, TypeOrModel)
		{
			var colourPoints = this.GetColourPointsForModel(TypeOrModel);
			var inReachOfLamps = this.CheckPointInLampsReach(Point, colourPoints);
			var x = Point.X, y = Point.Y;
			
			if (!inReachOfLamps)
			{
				var pAB = this.GetClosestPointToPoints(colourPoints.Red, colourPoints.Green, Point);
				var pAC = this.GetClosestPointToPoints(colourPoints.Blue, colourPoints.Red, Point);
				var pBC = this.GetClosestPointToPoints(colourPoints.Green, colourPoints.Blue, Point);
				var dAB = this.GetDistanceBetweenTwoPoints(Point, pAB);
				var dAC = this.GetDistanceBetweenTwoPoints(Point, pAC);
				var dBC = this.GetDistanceBetweenTwoPoints(Point, pBC);
				var lowest = dAB;
				var closestPoint = pAB;

				if (dAC < lowest)
				{
					lowest = dAC;
					closestPoint = pAC;
				}

				if (dBC < lowest)
				{
					lowest = dBC;
					closestPoint = pBC;
				}

				x = closestPoint.X;
				y = closestPoint.Y;
			}
			
			return new CGPoint(x, y);
		},
		//Method from StackOverflow
		//http://stackoverflow.com/a/9493060/1676444
		HSLToRGB: function(Hue, Saturation, Lightness)
		{
			var red, green, blue;
			if (Saturation == 0)
			{
				red = green = blue = Lightness;
			}
			else
			{
				function hue2rgb(p, q, t)
				{
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				}

				var q = Lightness < 0.5 ? Lightness * (1 + Saturation) : Lightness + Saturation - Lightness * Saturation;
				var p = 2 * Lightness - q;
				red = hue2rgb(p, q, Hue + 1/3);
				green = hue2rgb(p, q, Hue);
				blue = hue2rgb(p, q, Hue - 1/3);
			}

			red = Math.round(red * 255);
			green = Math.round(green * 255);
			blue = Math.round(blue * 255);

			return { Red: red, Green: green, Blue: blue };
		},
		//Method from StackOverflow
		//http://stackoverflow.com/a/9493060/1676444
		RGBToHSL: function(Red, Green, Blue)
		{
			Red /= 255, Green /= 255, Blue /= 255;
			var max = Math.max(Red, Green, Blue), min = Math.min(Red, Green, Blue);
			var h, s, l = (max + min) / 2;

			if(max == min)
			{
				h = s = 0; // achromatic
			}
			else
			{
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max)
				{
					case Red: h = (Green - Blue) / d + (Green < Blue ? 6 : 0); break;
					case Green: h = (Blue - Red) / d + 2; break;
					case Blue: h = (Red - Green) / d + 4; break;
				}
				h /= 6;
			}
			return [h, s, l];
		}
	}
};

function CGPoint(X, Y, Luminance)
{
	this.X = X;
	this.Y = Y;
	this.Luminance = Luminance;
	this.getZ = function getZ()
	{
		return 1.0 - this.X - this.Y;
	}
}
