"""
Converts static color values in svg icons into dynamic values which will change with the system theme.
"""

from pathlib import Path
import re


# how close to match colors (in RGB 255 units)
tolerance = 10
# maps named colors to their RGB values in PsychoPy Light
colors = {
    'base': (255, 255, 255),
    'mantle': (242, 242, 242),
    'crust': (228, 228, 228),
    'overlay': (214, 214, 214),
    'outline': (102, 102, 110),
    'red': (242, 84, 91),
    'purple': (195, 190, 247),
    'blue': (2, 169, 234),
    'green': (108, 204, 116),
    'yellow': (241, 211, 5),
    'orange': (236, 151, 3),
}

def repl(match):
    # get RGB values
    rgb = [int(val) for val in match.groups()]
    # iterate through named colors
    for name, target in colors.items():
        # does it match within tolerance?
        if all(
            abs(a - b) < tolerance for a, b in zip(target, rgb)
        ):
            # replace with name
            return f"var(--{name})"

    # if no match, return unchanged
    return f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"


# iterate through icons
for file in Path(__file__).parent.glob("**/*.svg"):
    # read file
    content = file.read_text("utf-8")
    # do substitution
    content = re.sub(
        pattern=r"rgb\( *(\d*) *, *(\d*) *, *(\d*) *\)",
        repl=repl,
        string=content
    )
    # save file
    file.write_text(content, "utf-8")
