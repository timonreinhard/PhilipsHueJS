//More Information: https://github.com/PhilipsHue/PhilipsHueSDK-iOS-OSX/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md

var PhilipsHue = {
	//eg. Red = 240, Green = 200, Blue = 190, Type = "hueBulbs"/"livingColors"/"default"
	RGBToXY: function(Red, Green, Blue, TypeOrModel)
	{
		//Makes the value between 0 and 1
		Red = Red / 255;
		Green = Green / 255;
		Blue = Blue / 255;

		//Apply Gamma correction
		Red = (Red > 0.04045 ? Math.pow((Red + 0.055) / 1.055, 2.4) : Red / 12.92);
		Green = (Green > 0.04045 ? Math.pow((Green + 0.055) / 1.055, 2.4) : Green / 12.92);
		Blue = (Blue > 0.04045 ? Math.pow((Blue + 0.055) / 1.055, 2.4) : Blue / 12.92);

		//Convert RGB values to XYZ
		var x = Red * 0.649926 + Green * 0.103455 + Blue * 0.197109;
		var y = Red * 0.234327 + Green * 0.743075 + Blue * 0.022598;
		var z = Red * 0.0000000 + Green * 0.053077 + Blue * 1.035763;

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

		return new CGPoint(cx, cy);
	},
	XYToRGB: function(Point, TypeOrModel)
	{
		//Check reach of lamp
		var colourPoints = this.Utilities.GetColourPointsForModel(TypeOrModel);
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
		}

		var x = Point.X;
		var y = Point.Y;
		var z = 1.0 - x - y;

		var Y = 1.0;
		var X = (Y / y) * x;
		var Z = (Y / y) * z;

		var r = X * 3.2406 - Y * 1.5372 - Z * 0.4986;
		var g = -X * 0.9689 + Y * 1.8758 + Z * 0.0415;
		var b = X * 0.0557 - Y * 0.2040 + Z * 1.0570;

		if (r > b && r > g && r > 1.0)
		{
			//Red is too big
			g = g / r;
			b = b / r;
			r = 1.0;
		}
		else if (g > b && g > r && g > 1.0)
		{
			//Green is too big
			r = r / g;
			b = b / g;
			g = 1.0;
		}
		else if (b > r && b > g && b > 1.0)
		{
			//Blue is too big
			r = r / b;
			g = g / b;
			b = 1.0;
		}

		//Apply Gamma Correctyion
		r = r <= 0.0031308 ? 12.92 * r : (1.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
		g = g <= 0.0031308 ? 12.92 * g : (1.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
		b = b <= 0.0031308 ? 12.92 * b : (1.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;


		if (r > b && r > g)
		{
			//Red is biggest
			if (r > 1.0)
			{
				g = g / r;
				b = b / r;
				r = 1.0;
			}
		}
		else if (g > b && g > r)
		{
			//Green is biggest
			if (g > 1.0)
			{
				r = r / g;
				b = b / g;
				g = 1.0;
			}
		}
		else if (b > r && b > g)
		{
			//Blue is biggest
			if (b > 1.0)
			{
				r = r / b;
				g = g / b;
				b = 1.0;
			}
		}

		r = Math.abs(Math.round(r * 255));
		g = Math.abs(Math.round(g * 255));
		b = Math.abs(Math.round(b * 255));
		return { Red: r, Green: g, Blue: b };
	},
	XYToTrueRGB: function(X, Y, TypeOrModel)
	{
		//Do the same as above but reverse it to its true values
	},
	Utilities: {
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
					Red: new CGPoint(0.674, 0.322),
					Green: new CGPoint(0.408, 0.517),
					Blue: new CGPoint(0.168, 0.041)
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

			return new CGPoint(PointA.X + PointB.X * t, PointA.Y + PointB.Y * t);
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
		}
	}
};

function CGPoint(X, Y)
{
	this.X = X;
	this.Y = Y;
}
