#include <stdio.h>
#include "march.h"

int main() {
    int dims[3] = {3, 2, 2};
    float potential[] = {1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0};
    float shift[3] = {0.0, 0.0, 0.0};
    float scale[3] = {1.0, 1.0, 1.0};

    float positions[200];
    unsigned int faces[200];
    unsigned int positionIndex;
    unsigned int faceIndex;

    marchingCubes(dims, potential, shift, scale, positions, faces, positionIndex, faceIndex);

    printf("position index: %d\n", positionIndex);
    printf("face index: %d\n", faceIndex);

    for (int i = 0; i < positionIndex; i++) {
        printf("%f, ", positions[i]);
    }

    printf("\n");

    for (int i = 0; i < faceIndex; i++) {
        printf("%d, ", faces[i]);
    }

    printf("\n");
}

