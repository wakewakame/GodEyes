# GodEyes
撮影された建物をBlenderという3Dソフトで再現するためのツールです。
類似したツールに[fSpy](https://github.com/stuffmatic/fSpy/)があります。
これは写真のパースとBlenderのパースを手作業で一致させることで写真をBlenderの下絵として配置できるようにするツールです。
しかし、fSpyではアスペクト比の異なる複数の画像の扱いが困難です。
GodEyesはこれを解決するために開発しました。
操作方法はfSpyとほどんど同じになります。

[GodEyesを試す](https://wakewakame.github.io/GodEyes/)

# 位置合わせ方法
## ARマーカー法
1. 写真に映る床や壁などの長方形の直線部分を用いてカメラの回転行列を算出する(ARマーカーの要領)。
2. 1で指定した長方形な面と垂直な直線を2組指定することで逆算カメラの内部パラメータ(cx, cy, fx, fy)を算出する。このパラメータは手動での調節も可能。
3. 写真の任意の点を原点(もしくは任意の座標)として設定する。
4. 3で指定した点から直線を生やして建物の3dモデルの仮組を作成する。

## n点位置合わせ法
1. 3dモデルの仮組の任意の点をn点選択し、それを写真の位置に一致させるように移動させる。
2. 必要に応じてカメラの内部パラメータを手動で調整する。

(カメラ行列を求めるには多分最低3点必要なはず?)

(カメラの内部パラメータを求めるには最低4点?)

(わからん)

## 差分位置合わせ
1. カメラ行列とカメラの内部パラメータを算出済みの2枚の写真から、それぞれ同じ位置を示す点を指定し、その点の3次元座標を逆算する。
