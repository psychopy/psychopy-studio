"""
Example Python script for testing the Coder outline panel.
"""
import math


GRAVITY = 9.81


def topLevelFunction(someArg, someKwarg="someKwarg"):
    # function with a nested helper function
    def nestedHelper(value):
        # function nested two levels deep
        def deeplyNestedHelper(other):
            return value + other

        return deeplyNestedHelper(1)

    return nestedHelper(someArg)


async def asyncFunction():
    return await something()


@staticmethod
def decoratedFunction():
    return None


class EmptyClass:
    pass


class SomeParentClass:
    def __init__(self, someArg, someKwarg="someKwarg"):
        self.someArg = someArg
        self.someKwarg = someKwarg

    @property
    def someProperty(self):
        return self.someArg

    class NestedClass:
        def nestedClassMethod(self):
            return None


class SomeChildClass(SomeParentClass):
    def __init__(self, someArg, someOtherArg):
        SomeParentClass.__init__(self, someArg)
        self.someOtherArg = someOtherArg

    def methodWithInnerFunction(self):
        def innerFunction():
            return math.pi

        return innerFunction()


if __name__ == "__main__":
    def conditionallyDefinedFunction():
        return GRAVITY

    conditionallyDefinedFunction()
